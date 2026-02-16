import { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";

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
    Select,
    Stack,
    Icon,
} from "@chakra-ui/react";
import { SearchIcon, ViewIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { apiPayment } from "../../../utils/Controllers/apiPayment";
import OrderDetailModal from "./__components/OrderDetailModal";
import { Ban, ReceiptRussianRuble, RotateCcw, Trash2, Undo2, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";
import OrderStatusMenu from "./__components/OrderStatusModal";
import OrderPayment from "./__components/OrderPayment";
import { useWarehouseStore } from "../../../store/useWarehouseStore";
import ReturnModal from "./__components/ReturnModal";

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
        colorScheme={type === "disposal" ? "orange" : type === "return" ? "red" : "blue"}
        borderRadius="md"
        px={2}
        py={0.5}
        fontSize="xs"
    >
        {type === "disposal" ? "Utilizatsiya" : type === "return" ? "Qaytarilgan" : "Sotuv"}
    </Badge>
);

const PaymentSt = ({ status }) => (
    <Badge
        colorScheme={status === "paid" ? "green" : "red"}
        borderRadius="md"
        px={2}
        py={0.5}
        fontSize="xs"
    >
        {status === "paid" ? "To'langan" : "To'lanmagan"}
    </Badge>
);

// ══════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════
export default function Orders() {
    const {
        cafeWarehouseId,
    } = useWarehouseStore();
    const [payments, setPayments] = useState([]);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderForPayment, setOrderForPayment] = useState(null);
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [returningOrder, setReturningOrder] = useState('');
    const [returning, setReturning] = useState(false);
    const [reason, setReason] = useState("")


    const detailModal = useDisclosure();
    const paymentModal = useDisclosure();
    const returnModal = useDisclosure();
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

                // Собираем только непустые параметры
                const params = {
                    page: pageNum,
                    limit: LIMIT,
                };

                // Добавляем поиск (если не пустой)
                if (search.trim()) {
                    params.search = search.trim();
                }

                // Добавляем фильтр по статусу оплаты (если выбран)
                if (paymentStatusFilter) {
                    params.paymentStatus = paymentStatusFilter;
                }

                // Добавляем фильтр по типу (если выбран)
                if (typeFilter) {
                    params.type = typeFilter;
                }


                const response = await apiPayment.Get(params);
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
                toast({
                    title: "Xatolik yuz berdi",
                    status: "error",
                    duration: 2000,
                    description: error?.response?.data?.message || error.message
                });
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [search, paymentStatusFilter, typeFilter, toast]
    );

    useEffect(() => {
        GetAllPayment(1, false);
    }, [paymentStatusFilter, typeFilter]);

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

    // ─── Payment modal ───
    const openPaymentModal = (order) => {
        setOrderForPayment(order);
        paymentModal.onOpen();
    };

    // ─── Clear filters ───
    const clearFilters = () => {
        setPaymentStatusFilter("");
        setTypeFilter("");
        setSearch("");
    };

    // ─── Summani yangilash ───
    const handleEditSum = async (paymentId, data) => {
        try {
            // const data = { receivedSum: sum };
            const response = await apiPayment.EditSum(paymentId, data);

            toast({
                title: "Muvaffaqiyatli",
                description: "To'lov summasi yangilandi",
                status: "success",
                duration: 2000,
            });

            // Ro'yxatni yangilash
            GetAllPayment(page, false);

            return response;
        } catch (error) {
            throw error;
        }
    };

    const openReturnModal = (order) => {
        if (order) setReturningOrder(order);
        returnModal.onOpen();
    };

    const returnOrder = async () => {
        if (!returningOrder) return;
        const returnData = {
            originalPaymentId: returningOrder?.id,
            createdBy: Cookies.get("user_id"),
            reason: reason || "Customer changed mind",
            items: returningOrder.items.map((item) => ({
                productId: item.product?.id,
                count: parseFloat(item.count),
                price: parseFloat(item.price),
            })),
        };
        try {
            setReturning(true);
            const response = await apiPayment.CreateReturn(returnData); // Yangi endpoint kerak bo'ladi

            toast({
                title: "Qaytarish bajarildi!",
                status: "success",
                duration: 3000,
            });

            // Tozalash
            setReturningOrder('')
            setReason("");
            GetAllPayment(page, false)
        } finally {
            setReturning(false);
        }
    }

    return (
        <Box bg={bgPage} minH="100vh" p={{ base: 3, md: 4 }}>
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

            {/* FILTERS AND SEARCH */}
            <Stack spacing={4} mb={6}>
                {/* SEARCH ROW */}
                <HStack mb={2} flexWrap="wrap" gap={2}>
                    <InputGroup flex={1} minW="200px">
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
                    {(paymentStatusFilter || typeFilter || search) && (
                        <Button variant="outline" onClick={clearFilters} size="md">
                            Filtrlarni tozalash
                        </Button>
                    )}
                </HStack>

                {/* FILTER SELECTS */}
                <HStack spacing={3} flexWrap="wrap">
                    <Select
                        value={paymentStatusFilter}
                        onChange={(e) => setPaymentStatusFilter(e.target.value)}
                        bg={inputBg}
                        borderColor={borderColor}
                        color={textPrimary}
                        width={{ base: "100%", md: "200px" }}
                        size="md"
                        placeholder="To'lov holati"
                    >
                        <option value="paid">To'langan</option>
                        <option value="unpaid">To'lanmagan</option>
                    </Select>

                    <Select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        bg={inputBg}
                        borderColor={borderColor}
                        color={textPrimary}
                        width={{ base: "100%", md: "200px" }}
                        size="md"
                        placeholder="Buyurtma turi"
                    >
                        <option value="sale">Sotuv</option>
                        <option value="disposal">Utilizatsiya</option>
                        <option value="return">Qaytarilgan</option>
                    </Select>
                </HStack>
            </Stack>

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
                                {/* <Th color={textMuted}>Turi</Th> */}
                                <Th color={textMuted}>To'lov usuli</Th>
                                <Th color={textMuted} isNumeric>Summa</Th>
                                <Th color={textMuted}>To'lov holati</Th>
                                <Th color={textMuted}>Sana</Th>
                                <Th>Amallar</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {/* Skeleton loading */}
                            {loading &&
                                payments.length === 0 &&
                                Array.from({ length: 10 }).map((_, i) => (
                                    <Tr key={`skel-${i}`}>
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <Td key={j}>
                                                <Skeleton h="16px" borderRadius="md" />
                                            </Td>
                                        ))}
                                    </Tr>
                                ))}

                            {/* Bo'sh */}
                            {!loading && payments.length === 0 && (
                                <Tr>
                                    <Td colSpan={8} textAlign="center" py={12} color={textMuted}>
                                        {search || paymentStatusFilter || typeFilter
                                            ? "Filtirlarga mos buyurtmalar topilmadi"
                                            : "Buyurtmalar topilmadi"}
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
                                    {/* <Td>
                                        <TypeBadge type={order.type} />
                                    </Td> */}
                                    <Td color={textPrimary} fontSize="sm">
                                        {order.payMethod?.name || "—"}
                                    </Td>
                                    <Td isNumeric fontWeight="semibold" color={textPrimary} fontSize="sm">
                                        {formatPrice(order.totalSum)}
                                    </Td>
                                    <Td>
                                        <PaymentSt status={order.paymentStatus} />
                                    </Td>
                                    <Td color={textMuted} fontSize="xs">
                                        {formatDate(order.createdAt)}
                                    </Td>
                                    <Td onClick={(e) => e.stopPropagation()}>
                                        <HStack spacing={1}>
                                            {/* <Tooltip label="Batafsil" hasArrow>
                                                <IconButton
                                                    size="sm"
                                                    icon={<ViewIcon />}
                                                    variant="ghost"
                                                    colorScheme="blue"
                                                    aria-label="Batafsil"
                                                    onClick={() => openDetail(order)}
                                                />
                                            </Tooltip> */}
                                            {/* <NavLink to={`/cafe/return/${order?.id}`}> */}
                                            <Tooltip label={order?.type === 'sale' ? "Zakazni qaytarish" : (order?.type === 'return' || order?.orderStatus === 'cancelled') ? 'Qaytarilgan' : 'Utilizatsiya qilingan'} hasArrow>
                                                {order?.type === "sale" ?
                                                    <IconButton
                                                        onClick={() => {
                                                            if (order?.orderStatus === 'cancelled') {
                                                                toast({
                                                                    title: "Allaqachon qaytarilgan !",
                                                                    status: "warning",
                                                                    duration: 3000,
                                                                });
                                                                return
                                                            }
                                                            openReturnModal(order)
                                                        }}
                                                        size="sm"
                                                        icon={<Undo2 />}
                                                        variant="ghost"
                                                        colorScheme="orange"
                                                        aria-label="Qaytarish"
                                                        cursor={order?.orderStatus === 'cancelled' ? 'not-allowed' : 'pointer'}
                                                        opacity={order?.orderStatus === 'cancelled' ? '0.5' : '1'}
                                                    /> : order?.type === 'return' ?
                                                        <Icon m={1} as={RotateCcw} color="danger" boxSize={6} cursor={'not-allowed'} opacity={'0.5'} />
                                                        : <Icon m={1} as={Ban} color="warning" boxSize={6} cursor={'not-allowed'} opacity={'0.5'} />
                                                }
                                            </Tooltip>
                                            {/* </NavLink> */}
                                            <Tooltip label={(order?.type === 'sale' && order?.paymentStatus !== 'paid') ? "To'lov qilish" : "Sotuv va to'lanmagan zakazlarga to'lov qilinadi"} hasArrow>
                                                <IconButton
                                                    cursor={(order?.type === 'sale' && order?.paymentStatus !== 'paid') ? 'pointer' : 'not-allowed'}
                                                    opacity={(order?.type === 'sale' && order?.paymentStatus !== 'paid') ? '1' : '0.5'}
                                                    size="sm"
                                                    icon={<Wallet />}
                                                    variant="ghost"
                                                    colorScheme="green"
                                                    aria-label="To'lov qilish"
                                                    onClick={() => openPaymentModal(order)}
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

            {/* PAYMENT MODAL */}
            <OrderPayment
                isOpen={paymentModal.isOpen}
                onClose={paymentModal.onClose}
                paymentId={orderForPayment?.id}
                orderData={orderForPayment}
                onSumUpdated={handleEditSum}
                cafeWarehouseId={cafeWarehouseId}
            />
            {/* Return Modal */}
            <ReturnModal
                isOpen={returnModal.isOpen}
                onClose={returnModal.onClose}
                order={returningOrder}
                returning={returning}
                returnOrder={returnOrder}
                reason={reason}
                setReason={(e) => setReason(e.target.value)}
            />
        </Box>
    );
}