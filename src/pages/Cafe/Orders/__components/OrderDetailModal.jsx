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
  Divider, // <-- qo‘shildi
} from "@chakra-ui/react";
import { Printer } from "lucide-react";
import { apiPrinter } from "../../../../utils/Controllers/apiPrinter";
import { useState } from "react";

// ─── Helpers ───
const formatPrice = (price) => Number(price).toLocaleString("uz-UZ") + " so'm";

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
    <Badge
      colorScheme={s.color}
      borderRadius="md"
      px={2}
      py={0.5}
      fontSize="xs"
    >
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
function InfoRow({ label, value, bold, accent, wrap }) {
  const textMuted = useColorModeValue("gray.500", "gray.400");
  const textPrimary = useColorModeValue("gray.800", "gray.100");
  const accentColor = useColorModeValue("blue.600", "blue.300");
  const divider = useColorModeValue("gray.100", "gray.600");

  if (wrap) {
    return (
      <Box
        py={2}
        borderBottomWidth="1px"
        borderColor={divider}
        _last={{ borderBottomWidth: 0 }}
      >
        <Text fontSize="sm" color={textMuted} mb={1}>
          {label}
        </Text>
        <Text
          fontSize="sm"
          color={accent ? accentColor : textPrimary}
          fontWeight={bold ? "bold" : "medium"}
          whiteSpace="pre-wrap"
          wordBreak="break-word"
        >
          {value}
        </Text>
      </Box>
    );
  }

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

// ─── To'lov usuli qatori: bitta yoki bir nechta usulga bo'lingan holat ───
// Har bir usul o'rtasida Divider qo'shildi
function SplitPaymentRows({ order }) {
  const textMuted = useColorModeValue("gray.500", "gray.400");
  const textPrimary = useColorModeValue("gray.800", "gray.100");
  const divider = useColorModeValue("gray.100", "gray.600");

  const hasSplit =
    Array.isArray(order?.methodSplits) && order.methodSplits.length > 0;

  if (!hasSplit) return null;

  return (
    <Box
      py={2}
      borderBottomWidth="1px"
      borderColor={divider}
      _last={{ borderBottomWidth: 0 }}
    >
      <Text fontSize="sm" color={textMuted} mb={1.5}>
        To'lov usullari bo'yicha
      </Text>
      <VStack
        align="stretch"
        spacing={0}
        divider={<Divider borderColor={divider} />}
      >
        {order.methodSplits.map((sp, i) => (
          <Flex key={sp.id || i} justify="space-between" align="center" py={1}>
            <Text fontSize="sm" color={textPrimary}>
              {sp.payMethod?.name || "—"}
            </Text>
            <Text fontSize="sm" color={textPrimary} fontWeight="semibold">
              {formatPrice(sp.amount)}
            </Text>
          </Flex>
        ))}
      </VStack>
    </Box>
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

  const [printing, setPrinting] = useState(false);

  if (!order) return null;

  const hasSplit =
    Array.isArray(order?.methodSplits) && order.methodSplits.length > 0;

  const handlePrint = async (id) => {
    setPrinting(true);
    try {
      const res = await apiPrinter.printPayment(id);
    } finally {
      setPrinting(false);
    }
  };

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
              <StatusBadge status={order.orderStatus} />
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

            {/* Bitta to'lov usuli bo'lsa oddiy qator, bo'lingan bo'lsa — ro'yxat */}
            {!hasSplit && (
              <InfoRow
                label="To'lov usuli"
                value={order.payMethod?.name || "—"}
              />
            )}
            <SplitPaymentRows order={order} />

            <InfoRow label="Kassa" value={order.cash?.name || "Tanlanmagan"} />
            <InfoRow
              label="Umumiy summa"
              value={formatPrice(order.totalSum)}
              bold
              accent
            />
            <InfoRow
              label="Qabul qilingan"
              value={formatPrice(order.receivedSum)}
            />
            <InfoRow label="Qaytim" value={formatPrice(order.changeSum)} />
            <InfoRow label="Izoh" value={order.note || "—"} wrap />
          </Box>

          {/* Mahsulotlar jadvali */}
          <Text fontWeight="bold" color={textPrimary} mb={3} fontSize="sm">
            Mahsulotlar ({order.items?.length || 0})
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
                  <Th color={textMuted}>Mahsulot</Th>
                  <Th color={textMuted} isNumeric>
                    Narx
                  </Th>
                  <Th color={textMuted} isNumeric>
                    Soni
                  </Th>
                  <Th color={textMuted} isNumeric>
                    Jami
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {order.items?.map((item, idx) => (
                  <Tr key={item.id}>
                    <Td color={textPrimary} fontSize="sm">
                      {idx + 1}
                    </Td>
                    <Td color={textPrimary} fontSize="xs" fontFamily="mono">
                      {item?.product?.name}
                    </Td>
                    <Td isNumeric color={textPrimary} fontSize="sm">
                      {formatPrice(item.price)}
                    </Td>
                    <Td isNumeric color={textPrimary} fontSize="sm">
                      {item.count}
                    </Td>
                    <Td
                      isNumeric
                      fontWeight="semibold"
                      color={accentColor}
                      fontSize="sm"
                    >
                      {formatPrice(item.price * item.count)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
          <Button
            isLoading={printing}
            loadingText="Chop etilmoqda..."
            leftIcon={<Printer size={16} />}
            colorScheme="blue"
            onClick={() => handlePrint(order?.id)}
          >
            Chek chiqarish
          </Button>
          <Button onClick={onClose} variant="ghost" color={textPrimary}>
            Yopish
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
