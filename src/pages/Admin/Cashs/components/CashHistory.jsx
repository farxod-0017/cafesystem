import {
    Box,
    Flex,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Select,
    Badge,
    Text,
    Icon,
    Stack,
    Skeleton,
    Button,
    useBreakpointValue
} from "@chakra-ui/react";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { apiPaymentCash } from "../../../../utils/Controllers/apiPaymentCash";
import { formatDateTime } from "../../../../utils/tools/formatDateTime";

export default function CashHistory({ items=[] }) {

    const [selectedCashId, setSelectedCashId] = useState(null);

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0
    });

    const isMobile = useBreakpointValue({ base: true, md: false });

    // auto select logic
    useEffect(() => {
        if (!items || items.length === 0) return;

        if (items.length === 1) {
            setSelectedCashId(items[0].id);
        }
    }, [items]);

    // fetch history
    const fetchHistory = async () => {
        if (!selectedCashId) return;

        try {
            setLoading(true);

            const res = await apiPaymentCash.getPage(
                selectedCashId,
                page,
                limit
            );

            setRecords(res.data.data?.records);
            setPagination(res.data.data?.pagination);

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [selectedCashId, page, limit]);

    const formatAmount = (amount) => {
        const num = Number(amount);
        return num.toLocaleString("ru-RU") + " so'm";
    };

    const renderBadge = (type) => {

        if (type === "deposit") {
            return (
                <Badge bg="successBg" color="success">
                    Deposit
                </Badge>
            );
        }

        return (
            <Badge bg="dangerBg" color="danger">
                Withdraw
            </Badge>
        );
    };

    return (
        <Box mt={10}>

            <Flex
                justify="space-between"
                align="center"
                mb={4}
                wrap="wrap"
                gap={3}
            >

                <Heading size="md">
                    Pul qo‘yish va yechishlar tarixi
                </Heading>

                {/* CASH SELECTOR */}

                {items.length > 1 && (
                    <Select
                        maxW="250px"
                        bg="surface"
                        value={selectedCashId || ""}
                        onChange={(e) => {
                            setSelectedCashId(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">
                            Kassani tanlang
                        </option>

                        {items.map((cash) => (
                            <option
                                key={cash.id}
                                value={cash.id}
                            >
                                {cash.name}
                            </option>
                        ))}
                    </Select>
                )}

            </Flex>

            {/* LOADING */}

            {loading ? (
                <Stack>
                    <Skeleton h="50px" />
                    <Skeleton h="50px" />
                    <Skeleton h="50px" />
                </Stack>
            ) : records.length === 0 ? (

                <Box
                    bg="surface"
                    border="1px solid"
                    borderColor="border"
                    p={6}
                    rounded="xl"
                    textAlign="center"
                >
                    <Text color="textSecondary">
                        Hech qanday operatsiya mavjud emas
                    </Text>
                </Box>

            ) : isMobile ? (

                // MOBILE TIMELINE

                <Stack
                    spacing={4}
                >

                    {records.map((r) => {

                        const isDeposit = r.type === "deposit";

                        return (
                            <Box
                                key={r.id}
                                bg="surface"
                                border="1px solid"
                                borderColor="border"
                                p={4}
                                rounded="xl"
                            >

                                <Flex
                                    justify="space-between"
                                    align="center"
                                >

                                    <Flex
                                        align="center"
                                        gap={2}
                                    >

                                        <Icon
                                            as={
                                                isDeposit
                                                    ? ArrowDownLeft
                                                    : ArrowUpRight
                                            }
                                            color={
                                                isDeposit
                                                    ? "success"
                                                    : "danger"
                                            }
                                        />

                                        {renderBadge(r.type)}

                                    </Flex>

                                    <Text
                                        fontWeight="600"
                                        color={
                                            isDeposit
                                                ? "success"
                                                : "danger"
                                        }
                                    >
                                        {isDeposit ? "+" : "-"}
                                        {formatAmount(r.amount)}
                                    </Text>

                                </Flex>

                                <Text
                                    mt={2}
                                    fontSize="sm"
                                    color="textSecondary"
                                >
                                    {formatDateTime(r.createdAt)}
                                </Text>

                                <Text
                                    mt={1}
                                    fontSize="sm"
                                >
                                    {r.note || "-"}
                                </Text>

                            </Box>
                        );
                    })}

                </Stack>

            ) : (

                // DESKTOP TABLE

                <Box
                    bg="surface"
                    border="1px solid"
                    borderColor="border"
                    rounded="xl"
                    overflow="hidden"
                >

                    <Table>

                        <Thead bg="mutedBg">
                            <Tr>
                                <Th>Sana</Th>
                                <Th>Turi</Th>
                                <Th>Summa</Th>
                                <Th>Izoh</Th>
                            </Tr>
                        </Thead>

                        <Tbody>

                            {records.map((r) => {

                                const isDeposit = r.type === "deposit";

                                return (
                                    <Tr key={r.id}>

                                        <Td>
                                            {formatDateTime(r.createdAt, "uz-UZ", {month:"2-digit"})}
                                        </Td>

                                        <Td>
                                            {renderBadge(r.type)}
                                        </Td>

                                        <Td
                                            fontWeight="600"
                                            color={
                                                isDeposit
                                                    ? "success"
                                                    : "danger"
                                            }
                                        >
                                            {isDeposit ? "+" : "-"}
                                            {formatAmount(r.amount)}
                                        </Td>

                                        <Td>
                                            {r.note || "-"}
                                        </Td>

                                    </Tr>
                                );
                            })}

                        </Tbody>

                    </Table>

                </Box>
            )}

            {/* PAGINATION */}

            {pagination.totalPages > 1 && (

                <Flex
                    justify="space-between"
                    align="center"
                    mt={4}
                    wrap="wrap"
                    gap={3}
                >

                    <Flex gap={2}>

                        <Button
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            isDisabled={page === 1}
                        >
                            Prev
                        </Button>

                        <Button
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            isDisabled={
                                page === pagination.totalPages
                            }
                        >
                            Next
                        </Button>

                    </Flex>

                    <Flex align="center" gap={2}>

                        <Text fontSize="sm">
                            Page {pagination.currentPage} / {pagination.totalPages}
                        </Text>

                        <Select
                            size="sm"
                            w="90px"
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </Select>

                    </Flex>

                </Flex>

            )}

        </Box>
    );
}