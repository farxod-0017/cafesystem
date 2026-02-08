import { useEffect, useState, useCallback } from "react";
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
    Input,
    InputGroup,
    InputLeftElement,
    HStack,
    useDisclosure,
    useColorModeValue,
    useToast,
    Skeleton,
    IconButton,
    Tooltip,
} from "@chakra-ui/react";
import { SearchIcon, ViewIcon, ChevronDownIcon, EditIcon } from "@chakra-ui/icons";
import { apiPayment } from "../../../utils/Controllers/apiPayment";
import OrderDetailModal from "./__components/OrderDetailModal";
import OrderStatusModal from "./__components/OrderStatusModal";
import { ReceiptRussianRuble, Undo2 } from "lucide-react";
import { NavLink } from "react-router-dom";

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
        {type === "debt" ? "Utiliziatsiya" : "Sotuv"}
    </Badge>
);

// ══════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════
export default function Orders() {
    const [payments, setPayments] = useState([]);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderForStatus, setOrderForStatus] = useState(null);

    const detailModal = useDisclosure();
    const statusModal = useDisclosure();
    const toast = useToast();
    const LIMIT = 20;

    // ─── Dark mode ranglar ───
    const bgPage = useColorModeValue("gray.50", "gray.900");
    const bgCard = useColorModeValue("white", "gray.800");
    const bgTableHead = useColorModeValue("gray.50", "gray.700");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const textMuted = useColorModeValue("gray.500", "gray.400");
    const textPrimary = useColorModeValue("gray.800", "gray.100");
    const accentColor = useColorModeValue("blue.600", "blue.300");
    const inputBg = useColorModeValue("white", "gray.700");
    const hoverBg = useColorModeValue("gray.50", "gray.700");

    // ─── API ───
    const GetAllPayment = useCallback(
        async (pageNum = 1, append = false) => {
            try {
                append ? setLoadingMore(true) : setLoading(true);

                const data = {
                    search: search.trim() || "all",
                    page: pageNum,
                    limit: LIMIT,
                };

                const response = await apiPayment.Get(data);
                const result = response?.data?.data || response?.data || response;
                const records = result?.records || [];
                const pagination = result?.pagination || {};

                if (append) {
                    setPayments((prev) => [...prev, ...records]);
                } else {
                    setPayments(records);
                }

                setHasNext(pagination.hasNext || false);
                setTotalCount(pagination.total_count || 0);
                setPage(pageNum);
            } catch (error) {
                console.log(error);
                toast({ title: "Xatolik yuz berdi", status: "error", duration: 2000 });
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [search, toast]
    );

    useEffect(() => {
        GetAllPayment(1, false);
    }, []);

    // ─── Search ───
    const handleSearch = () => {
        GetAllPayment(1, false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    // ─── Load more ───
    const loadMore = () => {
        GetAllPayment(page + 1, true);
    };

    // ─── Detail modal ───
    const openDetail = (order) => {
        setSelectedOrder(order);
        detailModal.onOpen();
    };

    // ─── Status modal ───
    const openStatusModal = (order) => {
        setOrderForStatus(order);
        statusModal.onOpen();
    };

    // ─── Status yangilanganda ───
    const handleStatusUpdated = () => {
        GetAllPayment(page, false); // Yangilash
    };

    return (
        <Box bg={bgPage} minH="100vh" p={{ base: 4, md: 6 }}>
            {/* HEADER */}
            <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
                <HStack spacing={3}>
                    <Heading size="lg" color={textPrimary}>
                        Buyurtmalar
                    </Heading>
                    {totalCount > 0 && (
                        <Badge colorScheme="blue" fontSize="sm" borderRadius="md" px={2} py={0.5}>
                            {totalCount}
                        </Badge>
                    )}
                </HStack>
            </Flex>

            {/* SEARCH */}
            <HStack mb={6} maxW="500px">
                <InputGroup>
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color={textMuted} />
                    </InputLeftElement>
                    <Input
                        placeholder="Qidirish (raqam, ism...)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        bg={inputBg}
                        borderColor={borderColor}
                        color={textPrimary}
                        _placeholder={{ color: textMuted }}
                    />
                </InputGroup>
                <Button colorScheme="blue" onClick={handleSearch} isLoading={loading}>
                    Qidirish
                </Button>
            </HStack>

            {/* TABLE */}
            <Box
                bg={bgCard}
                borderRadius="xl"
                border="1px solid"
                borderColor={borderColor}
                overflow="hidden"
                mb={6}
            >
                <Box overflowX="auto">
                    <Table variant="simple" size="md">
                        <Thead bg={bgTableHead}>
                            <Tr>
                                <Th color={textMuted}>#</Th>
                                <Th color={textMuted}>Pay raqam</Th>
                                <Th color={textMuted}>Turi</Th>
                                <Th color={textMuted}>To'lov usuli</Th>
                                <Th color={textMuted} isNumeric>Summa</Th>
                                <Th color={textMuted}>Holat</Th>
                                <Th color={textMuted}>Yaratgan</Th>
                                <Th color={textMuted}>Sana</Th>
                                <Th></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {/* Skeleton loading */}
                            {loading &&
                                payments.length === 0 &&
                                Array.from({ length: 5 }).map((_, i) => (
                                    <Tr key={`skel-${i}`}>
                                        {Array.from({ length: 9 }).map((_, j) => (
                                            <Td key={j}>
                                                <Skeleton h="16px" borderRadius="md" />
                                            </Td>
                                        ))}
                                    </Tr>
                                ))}

                            {/* Bo'sh */}
                            {!loading && payments.length === 0 && (
                                <Tr>
                                    <Td colSpan={9} textAlign="center" py={12} color={textMuted}>
                                        Buyurtmalar topilmadi
                                    </Td>
                                </Tr>
                            )}

                            {/* Data */}
                            {payments.map((order, index) => (
                                <Tr
                                    key={order.id}
                                    cursor="pointer"
                                    _hover={{ bg: hoverBg }}
                                    transition="background 0.15s"
                                    onClick={() => openDetail(order)}
                                >
                                    <Td color={textPrimary} fontSize="sm">
                                        {index + 1}
                                    </Td>
                                    <Td fontWeight="semibold" color={accentColor} fontSize="sm">
                                        {order.payNumber}
                                    </Td>
                                    <Td>
                                        <TypeBadge type={order.type} />
                                    </Td>
                                    <Td color={textPrimary} fontSize="sm">
                                        {order.payMethod?.name || "—"}
                                    </Td>
                                    <Td isNumeric fontWeight="semibold" color={textPrimary} fontSize="sm">
                                        {formatPrice(order.totalSum)}
                                    </Td>
                                    <Td>
                                        <StatusBadge status={order.orderStatus} />
                                    </Td>
                                    <Td color={textPrimary} fontSize="sm">
                                        {order.created?.full_name || "—"}
                                    </Td>
                                    <Td color={textMuted} fontSize="xs">
                                        {formatDate(order.createdAt)}
                                    </Td>
                                    <Td onClick={(e) => e.stopPropagation()}>
                                        <HStack spacing={1}>
                                            <Tooltip label="Batafsil" hasArrow>
                                                <IconButton
                                                    size="sm"
                                                    icon={<ViewIcon />}
                                                    variant="ghost"
                                                    colorScheme="blue"
                                                    aria-label="Batafsil"
                                                    onClick={() => openDetail(order)}
                                                />
                                            </Tooltip>
                                            <NavLink to={`/cafe/return/${order?.id}`}>
                                                <Tooltip label="Utilizatsiya qilish" hasArrow>
                                                    <IconButton
                                                        size="sm"
                                                        icon={<Undo2 />}
                                                        variant="ghost"
                                                        colorScheme="orange"
                                                        aria-label="Utilizatsiya qilish"
                                                    />
                                                </Tooltip>
                                            </NavLink>
                                            <Tooltip label="Statusni o'zgartirish" hasArrow>
                                                <IconButton
                                                    size="sm"
                                                    icon={<EditIcon />}
                                                    variant="ghost"
                                                    colorScheme="orange"
                                                    aria-label="Statusni o'zgartirish"
                                                    onClick={() => openStatusModal(order)}
                                                />
                                            </Tooltip>
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            </Box>

            {/* KO'PROQ YUKLASH */}
            {hasNext && (
                <Flex justify="center" mb={6}>
                    <Button
                        onClick={loadMore}
                        isLoading={loadingMore}
                        loadingText="Yuklanmoqda..."
                        variant="outline"
                        colorScheme="blue"
                        leftIcon={<ChevronDownIcon />}
                    >
                        Ko'proq yuklash
                    </Button>
                </Flex>
            )}

            {/* Hammasi yuklangan */}
            {!hasNext && payments.length > 0 && !loading && (
                <Text textAlign="center" color={textMuted} fontSize="sm" mb={6}>
                    Barcha buyurtmalar ko'rsatildi ({payments.length} ta)
                </Text>
            )}

            {/* DETAIL MODAL */}
            <OrderDetailModal
                isOpen={detailModal.isOpen}
                onClose={detailModal.onClose}
                order={selectedOrder}
            />

            {/* STATUS MODAL */}
            <OrderStatusModal
                isOpen={statusModal.isOpen}
                onClose={statusModal.onClose}
                order={orderForStatus}
                onStatusUpdated={handleStatusUpdated}
            />
        </Box>
    );
}