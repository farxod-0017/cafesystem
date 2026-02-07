import {
    Box,
    Flex,
    Heading,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Text,
    Badge,
    VStack,
    HStack,
    useColorModeValue,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
} from "@chakra-ui/react";

// ─── Helpers ───
const formatPrice = (price) =>
    Number(price).toLocaleString("uz-UZ") + " so'm";

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const StatusBadge = ({ status }) => {
    const map = {
        pending: { color: "yellow", label: "Kutilmoqda" },
        preparing: { color: "blue", label: "Tayyorlanmoqda" },
        ready: { color: "green", label: "Tayyor" },
        completed: { color: "teal", label: "Yakunlangan" },
        cancelled: { color: "red", label: "Bekor qilingan" },
    };
    const s = map[status] || { color: "gray", label: status };
    return (
        <Badge colorScheme={s.color} borderRadius="md" px={2} py={0.5} fontSize="xs">
            {s.label}
        </Badge>
    );
};

const TypeBadge = ({ type }) => (
    <Badge
        colorScheme={type === "debt" ? "orange" : "blue"}
        borderRadius="md"
        px={2}
        py={0.5}
        fontSize="xs"
    >
        {type === "debt" ? "Nasiya" : "Naqd"}
    </Badge>
);

// ══════════════════════════════════
// INFO ROW (modal ichida)
// ══════════════════════════════════
function InfoRow({ label, value, bold, accent }) {
    const textMuted = useColorModeValue("gray.500", "gray.400");
    const textPrimary = useColorModeValue("gray.800", "gray.100");
    const accentColor = useColorModeValue("blue.600", "blue.300");
    const divider = useColorModeValue("gray.100", "gray.600");

    return (
        <Flex
            justify="space-between"
            align="center"
            py={2}
            borderBottomWidth="1px"
            borderColor={divider}
            _last={{ borderBottomWidth: 0 }}
        >
            <Text fontSize="sm" color={textMuted}>
                {label}
            </Text>
            <Text
                fontSize="sm"
                color={accent ? accentColor : textPrimary}
                fontWeight={bold ? "bold" : "medium"}
            >
                {value}
            </Text>
        </Flex>
    );
}

// ══════════════════════════════════
// DETAIL MODAL
// ══════════════════════════════════
export default function OrderDetailModal({ isOpen, onClose, order }) {
    const bgCard = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const textMuted = useColorModeValue("gray.500", "gray.400");
    const textPrimary = useColorModeValue("gray.800", "gray.100");
    const accentColor = useColorModeValue("blue.600", "blue.300");
    const bgTableHead = useColorModeValue("gray.50", "gray.700");
    const bgSubtle = useColorModeValue("gray.50", "gray.700");

    if (!order) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay bg="blackAlpha.600" />
            <ModalContent bg={bgCard} borderRadius="xl" mx={3}>
                <ModalHeader pb={2} borderBottomWidth="1px" borderColor={borderColor}>
                    <VStack align="flex-start" spacing={1}>
                        <HStack flexWrap="wrap" gap={2}>
                            <Text fontSize="lg" fontWeight="bold" color={textPrimary}>
                                {order.payNumber}
                            </Text>
                            <StatusBadge status={order.status} />
                            <TypeBadge type={order.type} />
                        </HStack>
                        <Text fontSize="xs" color={textMuted}>
                            {formatDate(order.createdAt)}
                        </Text>
                    </VStack>
                </ModalHeader>
                <ModalCloseButton color={textPrimary} />

                <ModalBody py={4}>
                    {/* Umumiy ma'lumot */}
                    <Box
                        bg={bgSubtle}
                        borderRadius="lg"
                        p={4}
                        mb={5}
                        border="1px solid"
                        borderColor={borderColor}
                    >
                        <InfoRow label="Yaratgan" value={order.created?.full_name || "—"} />
                        <InfoRow label="To'lov usuli" value={order.payMethod?.name || "—"} />
                        <InfoRow label="Kassa" value={order.cash?.name || "Tanlanmagan"} />
                        <InfoRow label="Umumiy summa" value={formatPrice(order.totalSum)} bold accent />
                        <InfoRow label="Qabul qilingan" value={formatPrice(order.receivedSum)} />
                        <InfoRow label="Qaytim" value={formatPrice(order.changeSum)} />
                    </Box>

                    {/* Mahsulotlar jadvali */}
                    <Text fontWeight="bold" color={textPrimary} mb={3} fontSize="sm">
                        Mahsulotlar ({order.paymentItems?.length || 0})
                    </Text>
                    <Box
                        borderRadius="lg"
                        border="1px solid"
                        borderColor={borderColor}
                        overflow="hidden"
                    >
                        <Table size="sm" variant="simple">
                            <Thead bg={bgTableHead}>
                                <Tr>
                                    <Th color={textMuted}>#</Th>
                                    <Th color={textMuted}>Mahsulot ID</Th>
                                    <Th color={textMuted} isNumeric>Narx</Th>
                                    <Th color={textMuted} isNumeric>Soni</Th>
                                    <Th color={textMuted} isNumeric>Jami</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {order.items?.map((item, idx) => (
                                    <Tr key={item.id}>
                                        <Td color={textPrimary} fontSize="sm">{idx + 1}</Td>
                                        <Td color={textPrimary} fontSize="xs" fontFamily="mono">
                                            {item.productId?.slice(0, 8)}...
                                        </Td>
                                        <Td isNumeric color={textPrimary} fontSize="sm">
                                            {formatPrice(item.price)}
                                        </Td>
                                        <Td isNumeric color={textPrimary} fontSize="sm">
                                            {item.count}
                                        </Td>
                                        <Td isNumeric fontWeight="semibold" color={accentColor} fontSize="sm">
                                            {formatPrice(item.price * item.count)}
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </Box>
                </ModalBody>

                <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
                    <Button onClick={onClose} variant="ghost" color={textPrimary}>
                        Yopish
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}