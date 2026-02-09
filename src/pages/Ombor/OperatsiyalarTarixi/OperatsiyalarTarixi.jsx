import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
    Box,
    Flex,
    Heading,
    Text,
    Button,
    IconButton,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Select,
    Stack,
    HStack,
    VStack,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    Divider,
    Skeleton,
    SkeletonText,
    Badge,
    Tooltip,
    useToast,
    FormControl,
    FormLabel,
    Alert,
    AlertIcon,
    AlertDescription,
    Center,
    Grid,
    GridItem,
    InputGroup,
    InputLeftElement,
    Input,
    Card,
    CardBody,
    useColorModeValue,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Collapse,
    Checkbox,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    PopoverArrow,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";
import {
    SearchIcon,
    DownloadIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    ViewIcon,
    SettingsIcon,
    CloseIcon,
    CalendarIcon,
    InfoIcon,
} from "@chakra-ui/icons";
import { apiInvoices } from "../../../utils/Controllers/Invoices";
import { useWarehouseStore } from "../../../store/useWarehouseStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";

// ==============================
// UTILITY FUNCTIONS
// ==============================

// Format number with spaces
const formatNumber = (num) => {
    return num?.toLocaleString("uz-UZ") || "0";
};

// Format date
const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// Get month start date
const getMonthStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
};

// Get today date
const getToday = () => {
    return new Date();
};

// Type labels
const TYPE_LABELS = {
    incoming: "Kirim",
    outgoing: "Chiqim",
    disposal: "Utilizatsiya",
    all: "Barchasi",
};

const TYPE_COLORS = {
    incoming: "green",
    outgoing: "blue",
    disposal: "orange",
};

// Status labels
const STATUS_LABELS = {
    sent: "Yuborildi",
    received: "Qabul qilindi",
    cancelled: "Bekor qilindi",
    all: "Barchasi",
};

const STATUS_COLORS = {
    sent: "yellow",
    received: "green",
    cancelled: "red",
};

// Payment labels
const PAYMENT_LABELS = {
    paid: "To'langan",
    unpaid: "To'lanmagan",
    "partially_paid": "Qisman to'langan",
    all: "Barchasi",
};

const PAYMENT_COLORS = {
    paid: "green",
    unpaid: "red",
    "partially_paid": "orange",
};

// Available status transitions
const STATUS_TRANSITIONS = {
    sent: ["received", "cancelled"],
    received: ["cancelled"],
    cancelled: ["received"],
};

// ==============================
// CUSTOM DATE PICKER WRAPPER
// ==============================

const CustomDatePicker = ({ selected, onChange, placeholder, ...props }) => {
    const inputBg = useColorModeValue("white", "gray.700");
    const borderColor = useColorModeValue("gray.200", "gray.600");

    return (
        <Box position="relative">
            <DatePicker
                selected={selected}
                onChange={onChange}
                dateFormat="dd.MM.yyyy"
                placeholderText={placeholder}
                customInput={
                    <Input
                        bg={inputBg}
                        borderColor={borderColor}
                        _hover={{ borderColor: "blue.400" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                        cursor="pointer"
                    />
                }
                {...props}
            />
            <Box
                position="absolute"
                right="12px"
                top="50%"
                transform="translateY(-50%)"
                pointerEvents="none"
            >
                <CalendarIcon color="gray.400" />
            </Box>
        </Box>
    );
};

// ==============================
// MAIN COMPONENT
// ==============================

export default function OperatsiyalarTarixi() {
    const toast = useToast();
    const detailModal = useDisclosure();
    const [searchParams, setSearchParams] = useSearchParams();

    const { mainWarehouseId, locationName } = useWarehouseStore();

    // ==============================
    // STATE MANAGEMENT
    // ==============================

    // Filters
    const [startDate, setStartDate] = useState(() => {
        const param = searchParams.get("start");
        return param ? new Date(param) : getMonthStart();
    });

    const [endDate, setEndDate] = useState(() => {
        const param = searchParams.get("end");
        return param ? new Date(param) : getToday();
    });

    const [operationType, setOperationType] = useState(() => searchParams.get("type") || "all");
    const [status, setStatus] = useState(() => searchParams.get("status") || "all");
    const [payment, setPayment] = useState(() => searchParams.get("payment") || "all");
    const [search, setSearch] = useState(() => searchParams.get("search") || "");
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get("page")) || 1);

    // Data
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [pagination, setPagination] = useState(null);

    // UI
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [showFilters, setShowFilters] = useState(true);

    // Column visibility
    const [visibleColumns, setVisibleColumns] = useState({
        invNumber: true,
        type: true,
        date: true,
        totalSum: true,
        status: true,
        paymentStatus: true,
        sender: true,
        receiver: true,
        note: false,
    });

    // ==============================
    // DEBOUNCED SEARCH
    // ==============================

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    // ==============================
    // UPDATE URL PARAMS
    // ==============================

    const updateURLParams = useCallback((filters) => {
        const params = new URLSearchParams();

        if (filters.startDate) params.set("start", filters.startDate.toISOString().split('T')[0]);
        if (filters.endDate) params.set("end", filters.endDate.toISOString().split('T')[0]);
        if (filters.type !== "all") params.set("type", filters.type);
        if (filters.status !== "all") params.set("status", filters.status);
        if (filters.payment !== "all") params.set("payment", filters.payment);
        if (filters.search) params.set("search", filters.search);
        if (filters.page > 1) params.set("page", filters.page);

        setSearchParams(params);
    }, [setSearchParams]);

    // ==============================
    // FETCH INVOICES
    // ==============================

    const fetchInvoices = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiInvoices.getFilteredInvoices(
                mainWarehouseId,
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0],
                operationType,
                status,
                payment,
                debouncedSearch || "all",
                currentPage
            );

            setInvoices(response.data.data?.records || []);
            setPagination(response.data.data?.pagination || null);

            // Update URL
            updateURLParams({
                startDate,
                endDate,
                type: operationType,
                status,
                payment,
                search: debouncedSearch,
                page: currentPage,
            });
        } finally {
            setIsLoading(false);
        }
    }, [
        mainWarehouseId,
        startDate,
        endDate,
        operationType,
        status,
        payment,
        debouncedSearch,
        currentPage,
        updateURLParams,
    ]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    // ==============================
    // FETCH INVOICE DETAILS
    // ==============================

    const fetchInvoiceDetail = async (invoiceId) => {
        setIsLoadingDetail(true);
        try {
            const response = await apiInvoices.getDetailedById(invoiceId);
            setSelectedInvoice(response.data);
            detailModal.onOpen();
        } finally {
            setIsLoadingDetail(false);
        }
    };

    // ==============================
    // UPDATE STATUS
    // ==============================

    const updateStatus = async (invoiceId, newStatus) => {
        const data = {
            status: newStatus,
        }
        try {
            await apiInvoices.UpdateStatus(data, invoiceId);
            // Refresh list
            fetchInvoices();
        } finally { }
    };

    // ==============================
    // CLEAR FILTERS
    // ==============================

    const clearFilters = () => {
        setStartDate(getMonthStart());
        setEndDate(getToday());
        setOperationType("all");
        setStatus("all");
        setPayment("all");
        setSearch("");
        setDebouncedSearch("");
        setCurrentPage(1);
        setSearchParams({});
    };

    // ==============================
    // QUICK FILTERS
    // ==============================

    const applyQuickFilter = (filter) => {
        const now = new Date();

        switch (filter) {
            case "today":
                setStartDate(now);
                setEndDate(now);
                break;
            case "week":
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                setStartDate(weekStart);
                setEndDate(now);
                break;
            case "month":
                setStartDate(getMonthStart());
                setEndDate(now);
                break;
            case "unpaid":
                setPayment("unpaid");
                break;
            case "incoming":
                setOperationType("incoming");
                break;
            case "outgoing":
                setOperationType("outgoing");
                break;
            default:
                break;
        }

        setCurrentPage(1);
    };

    // ==============================
    // FILTER CHANGE HANDLERS
    // ==============================

    const handleFilterChange = (setter) => (value) => {
        setter(value);
        setCurrentPage(1); // Reset to page 1 on filter change
    };

    // ==============================
    // EXPORT FUNCTIONS
    // ==============================

    const exportToExcel = () => {
        try {
            const worksheet = XLSX.utils.json_to_sheet(
                invoices.map((inv, index) => ({
                    "№": index + 1,
                    "Invoice raqami": inv.invNumber,
                    "Turi": TYPE_LABELS[inv.type],
                    "Status": STATUS_LABELS[inv.status],
                    "To'lov": PAYMENT_LABELS[inv.paymentStatus],
                    "Jo'natuvchi": inv.sender?.name || "—",
                    "Qabul qiluvchi": inv.receiver?.name || "—",
                    "Summa": inv.totalSum,
                    "Sana": formatDate(inv.createdAt),
                    "Izoh": inv.note || "—",
                }))
            );

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

            XLSX.writeFile(workbook, `Operatsiyalar_${new Date().toLocaleDateString()}.xlsx`);

            toast({
                title: "Muvaffaqiyatli",
                description: "Excel fayl yuklab olindi",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
        } catch (error) {
            toast({
                title: "Xatolik",
                description: "Excel faylni yaratishda xatolik",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();

            doc.setFontSize(16);
            doc.text(`Operatsiyalar tarixi - ${locationName}`, 14, 15);

            doc.setFontSize(10);
            doc.text(`Sana: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 22);

            const tableData = invoices.map((inv, index) => [
                index + 1,
                inv.invNumber,
                TYPE_LABELS[inv.type],
                STATUS_LABELS[inv.status],
                formatNumber(inv.totalSum),
                formatDate(inv.createdAt),
            ]);

            doc.autoTable({
                startY: 28,
                head: [["№", "Invoice", "Turi", "Status", "Summa", "Sana"]],
                body: tableData,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 153, 225] },
            });

            doc.save(`Operatsiyalar_${new Date().toLocaleDateString()}.pdf`);

            toast({
                title: "Muvaffaqiyatli",
                description: "PDF fayl yuklab olindi",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
        } catch (error) {
            toast({
                title: "Xatolik",
                description: "PDF faylni yaratishda xatolik",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // ==============================
    // DETAIL MODAL CALCULATIONS
    // ==============================

    const detailCalculations = useMemo(() => {
        if (!selectedInvoice?.invoiceItems) return null;

        const items = selectedInvoice.invoiceItems;

        const subtotal = items.reduce((sum, item) => {
            const itemPrice = parseFloat(item.salePrice || item.purchasePrice);
            const itemQty = parseFloat(item.quantity);
            return sum + (itemPrice * itemQty);
        }, 0);

        const totalDiscount = items.reduce((sum, item) => {
            const itemPrice = parseFloat(item.salePrice || item.purchasePrice);
            const itemQty = parseFloat(item.quantity);
            const discount = parseFloat(item.discount) || 0;
            return sum + ((itemPrice * itemQty) * (discount / 100));
        }, 0);

        const grandTotal = subtotal - totalDiscount;

        return {
            subtotal,
            totalDiscount,
            grandTotal,
            hasDiscount: totalDiscount > 0,
        };
    }, [selectedInvoice]);

    // ==============================
    // COLORS
    // ==============================

    const bgColor = useColorModeValue("gray.50", "gray.900");
    const cardBg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const hoverBg = useColorModeValue("gray.100", "gray.700");
    const inputBg = useColorModeValue("white", "gray.700");

    // ==============================
    // ACTIVE FILTER COUNT
    // ==============================

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (operationType !== "all") count++;
        if (status !== "all") count++;
        if (payment !== "all") count++;
        if (search) count++;
        return count;
    }, [operationType, status, payment, search]);

    // ==============================
    // RENDER
    // ==============================

    return (
        <Box bg={bgColor} minH="100vh" p={{ base: 4, md: 6 }}>
            {/* HEADER */}
            <Flex
                justify="space-between"
                align="center"
                mb={6}
                flexDir={{ base: "column", sm: "row" }}
                gap={4}
            >
                <VStack align={{ base: "center", sm: "start" }} spacing={1}>
                    <Heading size={{ base: "md", md: "lg" }}>
                        Operatsiyalar tarixi
                    </Heading>
                    <Text fontSize="sm" color="gray.500">
                        {locationName}
                    </Text>
                </VStack>

                {/* EXPORT MENU */}
                <HStack spacing={3}>
                    <Menu>
                        <MenuButton
                            as={Button}
                            leftIcon={<DownloadIcon />}
                            colorScheme="blue"
                            size={{ base: "sm", md: "md" }}
                        >
                            Yuklab olish
                        </MenuButton>
                        <MenuList>
                            <MenuItem onClick={exportToExcel}>
                                Excel (.xlsx)
                            </MenuItem>
                            {/* <MenuItem onClick={exportToPDF}>
                                PDF
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handlePrint}>
                                Chop etish
                            </MenuItem> */}
                        </MenuList>
                    </Menu>

                    {/* COLUMN SELECTOR */}
                    <Popover placement="bottom-end">
                        <PopoverTrigger>
                            <IconButton
                                icon={<SettingsIcon />}
                                variant="outline"
                                size={{ base: "sm", md: "md" }}
                                aria-label="Ustunlar"
                            />
                        </PopoverTrigger>
                        <PopoverContent>
                            <PopoverArrow />
                            <PopoverBody>
                                <VStack align="stretch" spacing={2}>
                                    <Text fontWeight="bold" fontSize="sm">
                                        Ustunlar
                                    </Text>
                                    <Divider />

                                    <Checkbox
                                        isChecked={visibleColumns.invNumber}
                                        isDisabled
                                    >
                                        Invoice raqami
                                    </Checkbox>

                                    <Checkbox
                                        isChecked={visibleColumns.type}
                                        isDisabled
                                    >
                                        Turi
                                    </Checkbox>

                                    <Checkbox
                                        isChecked={visibleColumns.date}
                                        isDisabled
                                    >
                                        Sana
                                    </Checkbox>

                                    <Checkbox
                                        isChecked={visibleColumns.totalSum}
                                        isDisabled
                                    >
                                        Summa
                                    </Checkbox>

                                    <Checkbox
                                        isChecked={visibleColumns.status}
                                        onChange={(e) => setVisibleColumns({ ...visibleColumns, status: e.target.checked })}
                                    >
                                        Status
                                    </Checkbox>

                                    <Checkbox
                                        isChecked={visibleColumns.paymentStatus}
                                        onChange={(e) => setVisibleColumns({ ...visibleColumns, paymentStatus: e.target.checked })}
                                    >
                                        To'lov holati
                                    </Checkbox>

                                    <Checkbox
                                        isChecked={visibleColumns.sender}
                                        onChange={(e) => setVisibleColumns({ ...visibleColumns, sender: e.target.checked })}
                                    >
                                        Jo'natuvchi
                                    </Checkbox>

                                    <Checkbox
                                        isChecked={visibleColumns.receiver}
                                        onChange={(e) => setVisibleColumns({ ...visibleColumns, receiver: e.target.checked })}
                                    >
                                        Qabul qiluvchi
                                    </Checkbox>

                                    <Checkbox
                                        isChecked={visibleColumns.note}
                                        onChange={(e) => setVisibleColumns({ ...visibleColumns, note: e.target.checked })}
                                    >
                                        Izoh
                                    </Checkbox>
                                </VStack>
                            </PopoverBody>
                        </PopoverContent>
                    </Popover>
                </HStack>
            </Flex>

            {/* QUICK FILTERS */}
            <Wrap spacing={2} mb={4}>
                <WrapItem>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyQuickFilter("today")}
                    >
                        Bugun
                    </Button>
                </WrapItem>
                <WrapItem>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyQuickFilter("week")}
                    >
                        Shu hafta
                    </Button>
                </WrapItem>
                <WrapItem>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyQuickFilter("month")}
                    >
                        Shu oy
                    </Button>
                </WrapItem>
                <WrapItem>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyQuickFilter("unpaid")}
                    >
                        To'lanmagan
                    </Button>
                </WrapItem>
                <WrapItem>
                    <Button
                        size="sm"
                        variant="outline"
                        colorScheme="green"
                        onClick={() => applyQuickFilter("incoming")}
                    >
                        Kirim
                    </Button>
                </WrapItem>
                <WrapItem>
                    <Button
                        size="sm"
                        variant="outline"
                        colorScheme="blue"
                        onClick={() => applyQuickFilter("outgoing")}
                    >
                        Chiqim
                    </Button>
                </WrapItem>
            </Wrap>

            {/* FILTER PANEL */}
            <Card bg={cardBg} borderColor={borderColor} mb={6}>
                <CardBody>
                    <Flex justify="space-between" align="center" mb={showFilters ? 4 : 0}>
                        <HStack>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowFilters(!showFilters)}
                                rightIcon={showFilters ? <ChevronUpIcon /> : <ChevronDownIcon />}
                            >
                                Filterlar
                                {activeFilterCount > 0 && (
                                    <Badge ml={2} colorScheme="blue">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>
                        </HStack>

                        {activeFilterCount > 0 && (
                            <Button
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                leftIcon={<CloseIcon />}
                                onClick={clearFilters}
                            >
                                Tozalash
                            </Button>
                        )}
                    </Flex>

                    <Collapse in={showFilters} animateOpacity>
                        <Grid
                            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
                            gap={4}
                        >
                            {/* START DATE */}
                            <GridItem>
                                <FormControl>
                                    <FormLabel fontSize="sm">Boshlanish sanasi</FormLabel>
                                    <CustomDatePicker
                                        selected={startDate}
                                        onChange={(date) => handleFilterChange(setStartDate)(date)}
                                        maxDate={endDate}
                                        placeholder="Tanlang..."
                                    />
                                </FormControl>
                            </GridItem>

                            {/* END DATE */}
                            <GridItem>
                                <FormControl>
                                    <FormLabel fontSize="sm">Tugash sanasi</FormLabel>
                                    <CustomDatePicker
                                        selected={endDate}
                                        onChange={(date) => handleFilterChange(setEndDate)(date)}
                                        minDate={startDate}
                                        maxDate={getToday()}
                                        placeholder="Tanlang..."
                                    />
                                </FormControl>
                            </GridItem>

                            {/* OPERATION TYPE */}
                            <GridItem>
                                <FormControl>
                                    <FormLabel fontSize="sm">Operatsiya turi</FormLabel>
                                    <Select
                                        value={operationType}
                                        onChange={(e) => handleFilterChange(setOperationType)(e.target.value)}
                                        bg={inputBg}
                                        borderColor={borderColor}
                                    >
                                        <option value="all">Barchasi</option>
                                        <option value="incoming">Kirim</option>
                                        <option value="outgoing">Chiqim</option>
                                        <option value="disposal">Utilizatsiya</option>
                                    </Select>
                                </FormControl>
                            </GridItem>

                            {/* STATUS */}
                            <GridItem>
                                <FormControl>
                                    <FormLabel fontSize="sm">Status</FormLabel>
                                    <Select
                                        value={status}
                                        onChange={(e) => handleFilterChange(setStatus)(e.target.value)}
                                        bg={inputBg}
                                        borderColor={borderColor}
                                    >
                                        <option value="all">Barchasi</option>
                                        <option value="sent">Yuborildi</option>
                                        <option value="received">Qabul qilindi</option>
                                        <option value="cancelled">Bekor qilindi</option>
                                    </Select>
                                </FormControl>
                            </GridItem>

                            {/* PAYMENT */}
                            <GridItem>
                                <FormControl>
                                    <FormLabel fontSize="sm">To'lov holati</FormLabel>
                                    <Select
                                        value={payment}
                                        onChange={(e) => handleFilterChange(setPayment)(e.target.value)}
                                        bg={inputBg}
                                        borderColor={borderColor}
                                    >
                                        <option value="all">Barchasi</option>
                                        <option value="paid">To'langan</option>
                                        <option value="unpaid">To'lanmagan</option>
                                        <option value="partly-paid">Qisman to'langan</option>
                                    </Select>
                                </FormControl>
                            </GridItem>

                            {/* SEARCH */}
                            <GridItem>
                                <FormControl>
                                    <FormLabel fontSize="sm">Qidirish</FormLabel>
                                    <InputGroup>
                                        <InputLeftElement pointerEvents="none">
                                            <SearchIcon color="gray.400" />
                                        </InputLeftElement>
                                        <Input
                                            placeholder="Invoice raqami..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            bg={inputBg}
                                            borderColor={borderColor}
                                        />
                                    </InputGroup>
                                </FormControl>
                            </GridItem>
                        </Grid>
                    </Collapse>
                </CardBody>
            </Card>

            {/* LOADING STATE */}
            {isLoading && (
                <Card bg={cardBg} borderColor={borderColor}>
                    <CardBody>
                        <Stack spacing={3}>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <SkeletonText key={i} noOfLines={1} spacing="2" />
                            ))}
                        </Stack>
                    </CardBody>
                </Card>
            )}

            {/* EMPTY STATE */}
            {!isLoading && invoices.length === 0 && (
                <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>
                        Hech qanday operatsiya topilmadi
                    </AlertDescription>
                </Alert>
            )}

            {/* TABLE - DESKTOP */}
            {!isLoading && invoices.length > 0 && (
                <>
                    <Box
                        display={{ base: "none", lg: "block" }}
                        overflowX="auto"
                        bg={cardBg}
                        borderRadius="xl"
                        border="1px solid"
                        borderColor={borderColor}
                        mb={6}
                    >
                        <Table size="sm">
                            <Thead>
                                <Tr>
                                    <Th>#</Th>
                                    {visibleColumns.invNumber && <Th>Invoice raqami</Th>}
                                    {visibleColumns.type && <Th>Turi</Th>}
                                    {visibleColumns.date && <Th>Sana</Th>}
                                    {visibleColumns.totalSum && <Th isNumeric>Summa</Th>}
                                    {visibleColumns.status && <Th>Status</Th>}
                                    {visibleColumns.paymentStatus && <Th>To'lov</Th>}
                                    {visibleColumns.sender && <Th>Jo'natuvchi</Th>}
                                    {visibleColumns.receiver && <Th>Qabul qiluvchi</Th>}
                                    {visibleColumns.note && <Th>Izoh</Th>}
                                    <Th>Amallar</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {invoices.map((invoice, index) => (
                                    <Tr
                                        key={invoice.id}
                                        _hover={{ bg: hoverBg }}
                                        cursor="pointer"
                                        onClick={() => fetchInvoiceDetail(invoice.id)}
                                    >
                                        <Td>{(currentPage - 1) * 20 + index + 1}</Td>

                                        {visibleColumns.invNumber && (
                                            <Td>
                                                <Text fontSize="sm" fontWeight="medium">
                                                    {invoice.invNumber}
                                                </Text>
                                            </Td>
                                        )}

                                        {visibleColumns.type && (
                                            <Td>
                                                <Badge colorScheme={TYPE_COLORS[invoice.type]}>
                                                    {TYPE_LABELS[invoice.type]}
                                                </Badge>
                                            </Td>
                                        )}

                                        {visibleColumns.date && (
                                            <Td>
                                                <Text fontSize="sm">{formatDate(invoice.createdAt)}</Text>
                                            </Td>
                                        )}

                                        {visibleColumns.totalSum && (
                                            <Td isNumeric>
                                                <Text fontSize="sm" fontWeight="bold" color="blue.600">
                                                    {formatNumber(invoice.totalSum)} so'm
                                                </Text>
                                            </Td>
                                        )}

                                        {visibleColumns.status && (
                                            <Td onClick={(e) => e.stopPropagation()}>
                                                <Menu>
                                                    <MenuButton
                                                        as={Badge}
                                                        colorScheme={STATUS_COLORS[invoice.status]}
                                                        cursor="pointer"
                                                        _hover={{ opacity: 0.8 }}
                                                    >
                                                        {STATUS_LABELS[invoice.status]}
                                                    </MenuButton>
                                                    <MenuList>
                                                        {STATUS_TRANSITIONS[invoice.status]?.map((newStatus) => (
                                                            <MenuItem
                                                                key={newStatus}
                                                                onClick={() => updateStatus(invoice.id, newStatus)}
                                                            >
                                                                {STATUS_LABELS[newStatus]}
                                                            </MenuItem>
                                                        ))}
                                                    </MenuList>
                                                </Menu>
                                            </Td>
                                        )}

                                        {visibleColumns.paymentStatus && (
                                            <Td>
                                                <Badge colorScheme={PAYMENT_COLORS[invoice.paymentStatus]} fontSize="xs">
                                                    {PAYMENT_LABELS[invoice.paymentStatus]}
                                                </Badge>
                                            </Td>
                                        )}

                                        {visibleColumns.sender && (
                                            <Td>
                                                <Text fontSize="sm">{invoice.sender?.name || "—"}</Text>
                                            </Td>
                                        )}

                                        {visibleColumns.receiver && (
                                            <Td>
                                                <Text fontSize="sm">{invoice.receiver?.name || "—"}</Text>
                                            </Td>
                                        )}

                                        {visibleColumns.note && (
                                            <Td>
                                                <Text fontSize="sm" noOfLines={1}>
                                                    {invoice.note || "—"}
                                                </Text>
                                            </Td>
                                        )}

                                        <Td onClick={(e) => e.stopPropagation()}>
                                            <Tooltip label="Batafsil ko'rish">
                                                <IconButton
                                                    icon={<ViewIcon />}
                                                    size="sm"
                                                    variant="ghost"
                                                    colorScheme="blue"
                                                    onClick={() => fetchInvoiceDetail(invoice.id)}
                                                    aria-label="Batafsil"
                                                />
                                            </Tooltip>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </Box>

                    {/* CARDS - MOBILE/TABLET */}
                    <Stack
                        spacing={4}
                        display={{ base: "flex", lg: "none" }}
                        mb={6}
                    >
                        {invoices.map((invoice, index) => (
                            <Card
                                key={invoice.id}
                                bg={cardBg}
                                borderColor={borderColor}
                                cursor="pointer"
                                _hover={{ shadow: "md" }}
                                onClick={() => fetchInvoiceDetail(invoice.id)}
                            >
                                <CardBody>
                                    <VStack align="stretch" spacing={3}>
                                        {/* HEADER */}
                                        <Flex justify="space-between" align="start">
                                            <VStack align="start" spacing={1}>
                                                <Text fontSize="xs" color="gray.500">
                                                    #{(currentPage - 1) * 20 + index + 1}
                                                </Text>
                                                <Text fontWeight="bold" fontSize="sm">
                                                    {invoice.invNumber}
                                                </Text>
                                                <HStack spacing={2}>
                                                    <Badge colorScheme={TYPE_COLORS[invoice.type]} fontSize="xs">
                                                        {TYPE_LABELS[invoice.type]}
                                                    </Badge>
                                                    <Badge colorScheme={STATUS_COLORS[invoice.status]} fontSize="xs">
                                                        {STATUS_LABELS[invoice.status]}
                                                    </Badge>
                                                </HStack>
                                            </VStack>

                                            <VStack align="end" spacing={1}>
                                                <Text fontSize="lg" fontWeight="bold" color="blue.600">
                                                    {formatNumber(invoice.totalSum)}
                                                </Text>
                                                <Text fontSize="xs" color="gray.500">
                                                    so'm
                                                </Text>
                                            </VStack>
                                        </Flex>

                                        <Divider />

                                        {/* DETAILS */}
                                        <Grid templateColumns="repeat(2, 1fr)" gap={2} fontSize="sm">
                                            <Box>
                                                <Text color="gray.500" fontSize="xs">Sana</Text>
                                                <Text>{formatDate(invoice.createdAt)}</Text>
                                            </Box>

                                            <Box>
                                                <Text color="gray.500" fontSize="xs">To'lov</Text>
                                                <Badge colorScheme={PAYMENT_COLORS[invoice.paymentStatus]} fontSize="xs">
                                                    {PAYMENT_LABELS[invoice.paymentStatus]}
                                                </Badge>
                                            </Box>

                                            <Box>
                                                <Text color="gray.500" fontSize="xs">Jo'natuvchi</Text>
                                                <Text noOfLines={1}>{invoice.sender?.name || "—"}</Text>
                                            </Box>

                                            <Box>
                                                <Text color="gray.500" fontSize="xs">Qabul qiluvchi</Text>
                                                <Text noOfLines={1}>{invoice.receiver?.name || "—"}</Text>
                                            </Box>
                                        </Grid>

                                        {invoice.note && (
                                            <>
                                                <Divider />
                                                <Box>
                                                    <Text color="gray.500" fontSize="xs">Izoh</Text>
                                                    <Text fontSize="sm" noOfLines={2}>{invoice.note}</Text>
                                                </Box>
                                            </>
                                        )}

                                        <Divider />

                                        {/* ACTIONS */}
                                        <HStack justify="space-between">
                                            <Menu>
                                                <MenuButton
                                                    as={Button}
                                                    size="xs"
                                                    variant="outline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Statusni o'zgartirish
                                                </MenuButton>
                                                <MenuList>
                                                    {STATUS_TRANSITIONS[invoice.status]?.map((newStatus) => (
                                                        <MenuItem
                                                            key={newStatus}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateStatus(invoice.id, newStatus);
                                                            }}
                                                        >
                                                            {STATUS_LABELS[newStatus]}
                                                        </MenuItem>
                                                    ))}
                                                </MenuList>
                                            </Menu>

                                            <Button
                                                size="xs"
                                                colorScheme="blue"
                                                leftIcon={<ViewIcon />}
                                            >
                                                Batafsil
                                            </Button>
                                        </HStack>
                                    </VStack>
                                </CardBody>
                            </Card>
                        ))}
                    </Stack>

                    {/* PAGINATION */}
                    {pagination && pagination.total_pages > 1 && (
                        <Card bg={cardBg} borderColor={borderColor}>
                            <CardBody>
                                <Flex
                                    justify="space-between"
                                    align="center"
                                    flexDir={{ base: "column", md: "row" }}
                                    gap={4}
                                >
                                    {/* PAGE INFO */}
                                    <Text fontSize="sm" color="gray.600">
                                        Sahifa {pagination.currentPage} / {pagination.total_pages}
                                        {" • "}
                                        Jami: {pagination.total_count} ta
                                    </Text>

                                    {/* PAGE NAVIGATION */}
                                    <HStack spacing={2}>
                                        <Button
                                            size="sm"
                                            onClick={() => setCurrentPage(1)}
                                            isDisabled={currentPage === 1}
                                        >
                                            Birinchi
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            isDisabled={currentPage === 1}
                                        >
                                            Oldingi
                                        </Button>
                                        <Text fontSize="sm" px={2}>
                                            {currentPage}
                                        </Text>
                                        <Button
                                            size="sm"
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            isDisabled={currentPage === pagination.total_pages}
                                        >
                                            Keyingi
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => setCurrentPage(pagination.total_pages)}
                                            isDisabled={currentPage === pagination.total_pages}
                                        >
                                            Oxirgi
                                        </Button>
                                    </HStack>
                                </Flex>
                            </CardBody>
                        </Card>
                    )}
                </>
            )}

            {/* DETAIL MODAL */}
            <Modal
                isOpen={detailModal.isOpen}
                onClose={detailModal.onClose}
                size={{ base: "full", md: "4xl" }}
                scrollBehavior="inside"
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader borderBottomWidth="1px">
                        <Flex justify="space-between" align="center">
                            <VStack align="start" spacing={1}>
                                <Text>Invoice tafsilotlari</Text>
                                {selectedInvoice && (
                                    <Text fontSize="sm" fontWeight="normal" color="gray.500">
                                        {selectedInvoice.invNumber}
                                    </Text>
                                )}
                            </VStack>

                            {!isLoadingDetail && selectedInvoice && (
                                <HStack spacing={2}>
                                    <Badge colorScheme={TYPE_COLORS[selectedInvoice.type]}>
                                        {TYPE_LABELS[selectedInvoice.type]}
                                    </Badge>
                                    <Badge colorScheme={STATUS_COLORS[selectedInvoice.status]}>
                                        {STATUS_LABELS[selectedInvoice.status]}
                                    </Badge>
                                </HStack>
                            )}
                        </Flex>
                    </ModalHeader>

                    <ModalCloseButton />

                    <ModalBody py={6}>
                        {isLoadingDetail ? (
                            <Stack spacing={4}>
                                <SkeletonText noOfLines={4} spacing="4" />
                                <SkeletonText noOfLines={4} spacing="4" />
                            </Stack>
                        ) : selectedInvoice ? (
                            <VStack align="stretch" spacing={4}>
                                {/* INFO CARDS */}
                                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                                    <Card variant="outline">
                                        <CardBody>
                                            <VStack align="start" spacing={2}>
                                                <Text fontSize="xs" color="gray.500">Sana va vaqt</Text>
                                                <Text fontWeight="medium">{formatDateTime(selectedInvoice.createdAt)}</Text>
                                            </VStack>
                                        </CardBody>
                                    </Card>

                                    <Card variant="outline">
                                        <CardBody>
                                            <VStack align="start" spacing={2}>
                                                <Text fontSize="xs" color="gray.500">To'lov holati</Text>
                                                <Badge colorScheme={PAYMENT_COLORS[selectedInvoice.paymentStatus]}>
                                                    {PAYMENT_LABELS[selectedInvoice.paymentStatus]}
                                                </Badge>
                                            </VStack>
                                        </CardBody>
                                    </Card>

                                    <Card variant="outline">
                                        <CardBody>
                                            <VStack align="start" spacing={2}>
                                                <Text fontSize="xs" color="gray.500">Jo'natuvchi</Text>
                                                <Text fontWeight="medium">{selectedInvoice.sender?.name || "—"}</Text>
                                            </VStack>
                                        </CardBody>
                                    </Card>

                                    <Card variant="outline">
                                        <CardBody>
                                            <VStack align="start" spacing={2}>
                                                <Text fontSize="xs" color="gray.500">Qabul qiluvchi</Text>
                                                <Text fontWeight="medium">{selectedInvoice.receiver?.name || "—"}</Text>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                </Grid>

                                {selectedInvoice.note && (
                                    <Card variant="outline">
                                        <CardBody>
                                            <VStack align="start" spacing={2}>
                                                <Text fontSize="xs" color="gray.500">Izoh</Text>
                                                <Text>{selectedInvoice.note}</Text>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                )}

                                <Divider />

                                {/* ITEMS TABLE */}
                                <Box>
                                    <Text fontWeight="bold" mb={3}>Mahsulotlar</Text>
                                    <Box overflowX="auto">
                                        <Table size="sm" variant="simple">
                                            <Thead>
                                                <Tr>
                                                    <Th>#</Th>
                                                    <Th>Mahsulot</Th>
                                                    <Th>Partiya</Th>
                                                    <Th isNumeric>Narx</Th>
                                                    {detailCalculations?.hasDiscount && <Th isNumeric>Chegirma</Th>}
                                                    <Th isNumeric>Miqdor</Th>
                                                    <Th isNumeric>Jami</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {selectedInvoice.invoiceItems?.map((item, index) => {

                                                    const itemPrice = parseFloat(selectedInvoice.type === "incoming" ? item.purchasePrice : item.salePrice);
                                                    const itemQty = parseFloat(item.quantity);
                                                    const discount = parseFloat(item.discount) || 0;
                                                    const subtotal = itemPrice * itemQty;
                                                    const discountAmount = subtotal * (discount / 100);
                                                    const total = subtotal - discountAmount;

                                                    return (
                                                        <Tr key={item.id}>
                                                            <Td>{index + 1}</Td>
                                                            <Td>
                                                                <VStack align="start" spacing={0}>
                                                                    <Text fontWeight="medium">{item.product.name}</Text>
                                                                    <Text fontSize="xs" color="gray.500">{item.product.unit}</Text>
                                                                </VStack>
                                                            </Td>
                                                            <Td>
                                                                <Badge colorScheme="purple" fontSize="xs">
                                                                    {item.batch}
                                                                </Badge>
                                                            </Td>
                                                            <Td isNumeric>{formatNumber(itemPrice)}</Td>
                                                            {detailCalculations?.hasDiscount && (
                                                                <Td isNumeric>
                                                                    {discount > 0 ? (
                                                                        <VStack align="end" spacing={0}>
                                                                            <Text>{discount}%</Text>
                                                                            <Text fontSize="xs" color="orange.500">
                                                                                -{formatNumber(discountAmount)}
                                                                            </Text>
                                                                        </VStack>
                                                                    ) : (
                                                                        "—"
                                                                    )}
                                                                </Td>
                                                            )}
                                                            <Td isNumeric>{itemQty}</Td>
                                                            <Td isNumeric fontWeight="bold">
                                                                {formatNumber(total)}
                                                            </Td>
                                                        </Tr>
                                                    );
                                                })}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                </Box>

                                <Divider />

                                {/* SUMMARY */}
                                <Card variant="outline" bg={useColorModeValue("blue.50", "blue.900")}>
                                    <CardBody>
                                        <VStack align="stretch" spacing={2}>
                                            {detailCalculations?.hasDiscount && (
                                            <Flex justify="space-between">
                                                <Text>Oraliq jami:</Text>
                                                <Text fontWeight="medium">
                                                    {formatNumber(detailCalculations?.subtotal || 0)} so'm
                                                </Text>
                                            </Flex>)}

                                            {detailCalculations?.hasDiscount && (
                                                <Flex justify="space-between" color="orange.600">
                                                    <Text>Chegirma:</Text>
                                                    <Text fontWeight="medium">
                                                        -{formatNumber(detailCalculations.totalDiscount)} so'm
                                                    </Text>
                                                </Flex>
                                            )}
                                            {detailCalculations?.hasDiscount && (
                                            <Divider />)}

                                            <Flex justify="space-between" fontSize="lg">
                                                <Text fontWeight="bold">Jami:</Text>
                                                <Text fontWeight="bold" color="blue.600">
                                                    {/* {formatNumber(detailCalculations?.grandTotal || selectedInvoice.totalSum)} so'm */}
                                                    {selectedInvoice?.totalSum} so'm
                                                </Text>
                                            </Flex>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            </VStack>
                        ) : null}
                    </ModalBody>

                    <ModalFooter borderTopWidth="1px">
                        <HStack spacing={3}>
                            <Button variant="ghost" onClick={detailModal.onClose}>
                                Yopish
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.print()}
                            >
                                Chop etish
                            </Button>
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* PRINT STYLES */}
            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .chakra-modal__content,
          .chakra-modal__content * {
            visibility: visible;
          }
          
          .chakra-modal__content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none;
          }
          
          .chakra-modal__header,
          .chakra-modal__footer {
            display: none;
          }
          
          .chakra-button,
          .chakra-modal__close-btn {
            display: none !important;
          }
        }
      `}</style>
        </Box>
    );
}