import React, { useState, useMemo, useEffect, useRef } from "react";
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
    Input,
    Stack,
    HStack,
    VStack,
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
    Card,
    CardBody,
    useColorModeValue,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Divider,
    Select,
} from "@chakra-ui/react";
import {
    SearchIcon,
    DownloadIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    WarningIcon,
    InfoIcon,
} from "@chakra-ui/icons";
import { apiStock } from "../../../utils/Controllers/Stock";
import { useWarehouseStore } from "../../../store/useWarehouseStore";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// ==============================
// UTILITY FUNCTIONS
// ==============================

// Format number with spaces
const formatNumber = (num) => {
    return num?.toLocaleString("uz-UZ") || "0";
};

// Calculate batch age in days
const getBatchAge = (batch) => {
    if (!batch) return null;

    try {
        // Extract date from batch format: YYYYMMDD-PRICE-SEQ
        const dateStr = batch.split("-")[0];
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));

        const batchDate = new Date(year, month, day);
        const today = new Date();
        const diffTime = Math.abs(today - batchDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    } catch {
        return null;
    }
};

// Get batch age color
const getBatchAgeColor = (days) => {
    if (!days) return "gray";
    if (days < 30) return "green";
    if (days < 90) return "yellow";
    if (days < 180) return "orange";
    return "red";
};

// Highlight search text in string
const highlightText = (text, search) => {
    if (!search || !text) return text;

    const parts = text.split(new RegExp(`(${search})`, 'gi'));

    return (
        <>
            {parts.map((part, index) =>
                part.toLowerCase() === search.toLowerCase() ? (
                    <Text as="span" key={index} bg="yellow.200" fontWeight="bold" color="gray.800">
                        {part}
                    </Text>
                ) : (
                    part
                )
            )}
        </>
    );
};

// Normalize stock response
const normalizeStock = (stock) => {
    return {
        productId: stock.productId || stock.product?.id,
        productName: stock.product?.name || "—",
        unit: stock.product?.unit || "—",
        batch: stock.batch || "—",
        purchasePrice: parseFloat(stock.purchasePrice) || 0,
        salePrice: parseFloat(stock.salePrice) || 0,
        quantity: parseFloat(stock.quantity) || 0,
        barcode: stock.barcode || "",
        totalValue: (parseFloat(stock.purchasePrice) || 0) * (parseFloat(stock.quantity) || 0),
        batchAge: getBatchAge(stock.batch),
    };
};

// ==============================
// MAIN COMPONENT
// ==============================

export default function OmbordagiTovarlar() {
    const toast = useToast();
    const searchInputRef = useRef(null);

    const { mainWarehouseId, locationName } = useWarehouseStore();

    // ==============================
    // STATE MANAGEMENT
    // ==============================

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [stocks, setStocks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Sorting
    const [sortColumn, setSortColumn] = useState("productName");
    const [sortDirection, setSortDirection] = useState("asc"); // 'asc' | 'desc'

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    // ==============================
    // FETCH STOCKS
    // ==============================

    const fetchStocks = async (searchText = "") => {
        if (!mainWarehouseId) return;
        setIsLoading(true);
        try {
            const response = await apiStock.getStocksForOperationById(
                mainWarehouseId,
                searchText,
                "outgoing"
            );
            const normalized = (response.data || []).map(normalizeStock);
            setStocks(normalized);
            setCurrentPage(1); // Reset to first page on new search
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStocks();
        // Auto-focus search input
        setTimeout(() => searchInputRef.current?.focus(), 100);
    }, []);

    // ==============================
    // DEBOUNCED SEARCH
    // ==============================

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchStocks(debouncedSearch);
    }, [debouncedSearch]);

    // ==============================
    // SORTING
    // ==============================

    const handleSort = (column) => {
        if (sortColumn === column) {
            // Toggle direction
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            // New column, default asc
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const sortedStocks = useMemo(() => {
        if (!sortColumn) return stocks;

        return [...stocks].sort((a, b) => {
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];

            // Handle strings
            if (typeof aVal === "string") {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [stocks, sortColumn, sortDirection]);

    // ==============================
    // PAGINATION
    // ==============================

    const paginatedStocks = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return sortedStocks.slice(startIndex, endIndex);
    }, [sortedStocks, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedStocks.length / itemsPerPage);

    // ==============================
    // STATISTICS
    // ==============================

    const statistics = useMemo(() => {
        const totalProducts = new Set(sortedStocks.map(s => s.productId)).size;
        const totalBatches = sortedStocks.length;
        const totalValue = sortedStocks.reduce((sum, s) => sum + s.totalValue, 0);
        const lowStockItems = sortedStocks.filter(s => s.quantity < 10).length;
        const totalQuantity = sortedStocks.reduce((sum, s) => sum + s.quantity, 0);

        return {
            totalProducts,
            totalBatches,
            totalValue,
            lowStockItems,
            totalQuantity,
        };
    }, [sortedStocks]);

    // ==============================
    // EXPORT FUNCTIONS
    // ==============================

    const exportToExcel = () => {
        try {
            const worksheet = XLSX.utils.json_to_sheet(
                sortedStocks.map((stock, index) => ({
                    "№": index + 1,
                    "Mahsulot": stock.productName,
                    "Birlik": stock.unit,
                    "Partiya": stock.batch,
                    "Xarid narxi": stock.purchasePrice,
                    "Sotuv narxi": stock.salePrice,
                    "Miqdor": stock.quantity,
                    "Umumiy qiymat": stock.totalValue,
                    "Barcode": stock.barcode,
                }))
            );

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Ombordagi tovarlar");

            XLSX.writeFile(workbook, `Ombor_${locationName}_${new Date().toLocaleDateString()}.xlsx`);

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

    const exportToCSV = () => {
        try {
            const headers = ["№", "Mahsulot", "Birlik", "Partiya", "Xarid narxi", "Sotuv narxi", "Miqdor", "Umumiy qiymat", "Barcode"];

            const csvData = sortedStocks.map((stock, index) => [
                index + 1,
                stock.productName,
                stock.unit,
                stock.batch,
                stock.purchasePrice,
                stock.salePrice,
                stock.quantity,
                stock.totalValue,
                stock.barcode,
            ]);

            const csvContent = [
                headers.join(","),
                ...csvData.map(row => row.join(","))
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);

            link.setAttribute("href", url);
            link.setAttribute("download", `Ombor_${locationName}_${new Date().toLocaleDateString()}.csv`);
            link.style.visibility = "hidden";

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Muvaffaqiyatli",
                description: "CSV fayl yuklab olindi",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
        } catch (error) {
            toast({
                title: "Xatolik",
                description: "CSV faylni yaratishda xatolik",
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

            // Title
            doc.setFontSize(16);
            doc.text(`Ombordagi tovarlar - ${locationName}`, 14, 15);

            doc.setFontSize(10);
            doc.text(`Sana: ${new Date().toLocaleDateString()}`, 14, 22);

            // Table
            const tableData = sortedStocks.map((stock, index) => [
                index + 1,
                stock.productName,
                stock.unit,
                stock.batch,
                formatNumber(stock.purchasePrice),
                formatNumber(stock.salePrice),
                stock.quantity,
                formatNumber(stock.totalValue),
            ]);

            doc.autoTable({
                startY: 28,
                head: [["№", "Mahsulot", "Birlik", "Partiya", "Xarid", "Sotuv", "Miqdor", "Qiymat"]],
                body: tableData,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 153, 225] },
            });

            doc.save(`Ombor_${locationName}_${new Date().toLocaleDateString()}.pdf`);

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
    // COLORS
    // ==============================

    const bgColor = useColorModeValue("gray.50", "gray.900");
    const cardBg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const hoverBg = useColorModeValue("gray.100", "gray.700");
    const inputBg = useColorModeValue("white", "gray.700");

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
                        Ombordagi tovarlar qoldig'i
                    </Heading>
                    <Text fontSize="sm" color="gray.500">
                        {locationName}
                    </Text>
                </VStack>

                {/* EXPORT MENU */}
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
                        {/* <MenuItem onClick={exportToCSV}>
                            CSV
                        </MenuItem>
                        <MenuItem onClick={exportToPDF}>
                            PDF
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handlePrint}>
                            Chop etish
                        </MenuItem> */}
                    </MenuList>
                </Menu>
            </Flex>

            {/* STATISTICS DASHBOARD */}
            <Grid
                templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" }}
                gap={4}
                mb={6}
            >
                <Card bg={cardBg} borderColor={borderColor}>
                    <CardBody>
                        <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                                {search ? "Topilgan mahsulotlar" : "Jami mahsulotlar"}
                            </Text>
                            <Text fontSize="2xl" fontWeight="bold">
                                {statistics.totalProducts}
                            </Text>
                        </VStack>
                    </CardBody>
                </Card>

                <Card bg={cardBg} borderColor={borderColor}>
                    <CardBody>
                        <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                                Jami partiyalar
                            </Text>
                            <Text fontSize="2xl" fontWeight="bold">
                                {statistics.totalBatches}
                            </Text>
                        </VStack>
                    </CardBody>
                </Card>

                {/* <Card bg={cardBg} borderColor={borderColor}>
                    <CardBody>
                        <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                                Umumiy miqdor
                            </Text>
                            <Text fontSize="2xl" fontWeight="bold">
                                {formatNumber(statistics.totalQuantity)}
                            </Text>
                        </VStack>
                    </CardBody>
                </Card> */}

                <Card bg={cardBg} borderColor={borderColor}>
                    <CardBody>
                        <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                                Umumiy qiymat
                            </Text>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                {formatNumber(statistics.totalValue)}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                so'm
                            </Text>
                        </VStack>
                    </CardBody>
                </Card>

                <Card
                    // bg={statistics.lowStockItems > 0 ? "red.50" : cardBg}
                    borderColor={statistics.lowStockItems > 0 ? "red.200" : borderColor}
                >
                    <CardBody>
                        <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                                Kam qolgan
                            </Text>
                            <HStack>
                                <Text fontSize="2xl" fontWeight="bold" color={statistics.lowStockItems > 0 ? "red.500" : "gray.600"}>
                                    {statistics.lowStockItems}
                                </Text>
                                {statistics.lowStockItems > 0 && (
                                    <WarningIcon color="red.500" />
                                )}
                            </HStack>
                        </VStack>
                    </CardBody>
                </Card>
            </Grid>

            {/* SEARCH */}
            <FormControl mb={6}>
                <FormLabel fontSize="sm" fontWeight="medium">
                    Mahsulot qidirish
                </FormLabel>
                <InputGroup>
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                        ref={searchInputRef}
                        placeholder="Mahsulot nomini kiriting..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        bg={inputBg}
                        borderColor={borderColor}
                        _hover={{ borderColor: "blue.400" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                    />
                </InputGroup>
            </FormControl>

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
            {!isLoading && sortedStocks.length === 0 && (
                <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>
                        {search
                            ? `"${search}" bo'yicha natija topilmadi`
                            : "Omborda tovar yo'q"
                        }
                    </AlertDescription>
                </Alert>
            )}

            {/* TABLE - DESKTOP */}
            {!isLoading && sortedStocks.length > 0 && (
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
                                    <Th
                                        cursor="pointer"
                                        onClick={() => handleSort("productName")}
                                        _hover={{ bg: hoverBg }}
                                    >
                                        <HStack spacing={2}>
                                            <Text>Mahsulot</Text>
                                            {sortColumn === "productName" && (
                                                sortDirection === "asc" ? <ChevronUpIcon /> : <ChevronDownIcon />
                                            )}
                                        </HStack>
                                    </Th>
                                    <Th
                                        cursor="pointer"
                                        onClick={() => handleSort("unit")}
                                        _hover={{ bg: hoverBg }}
                                    >
                                        <HStack spacing={2}>
                                            <Text>Birlik</Text>
                                            {sortColumn === "unit" && (
                                                sortDirection === "asc" ? <ChevronUpIcon /> : <ChevronDownIcon />
                                            )}
                                        </HStack>
                                    </Th>
                                    <Th
                                        cursor="pointer"
                                        onClick={() => handleSort("batch")}
                                        _hover={{ bg: hoverBg }}
                                    >
                                        <HStack spacing={2}>
                                            <Text>Partiya</Text>
                                            {sortColumn === "batch" && (
                                                sortDirection === "asc" ? <ChevronUpIcon /> : <ChevronDownIcon />
                                            )}
                                        </HStack>
                                    </Th>
                                    <Th
                                        cursor="pointer"
                                        onClick={() => handleSort("purchasePrice")}
                                        _hover={{ bg: hoverBg }}
                                        isNumeric
                                    >
                                        <HStack spacing={2} justify="flex-end">
                                            <Text>Xarid narxi</Text>
                                            {sortColumn === "purchasePrice" && (
                                                sortDirection === "asc" ? <ChevronUpIcon /> : <ChevronDownIcon />
                                            )}
                                        </HStack>
                                    </Th>
                                    <Th
                                        cursor="pointer"
                                        onClick={() => handleSort("salePrice")}
                                        _hover={{ bg: hoverBg }}
                                        isNumeric
                                    >
                                        <HStack spacing={2} justify="flex-end">
                                            <Text>Sotuv narxi</Text>
                                            {sortColumn === "salePrice" && (
                                                sortDirection === "asc" ? <ChevronUpIcon /> : <ChevronDownIcon />
                                            )}
                                        </HStack>
                                    </Th>
                                    <Th
                                        cursor="pointer"
                                        onClick={() => handleSort("quantity")}
                                        _hover={{ bg: hoverBg }}
                                        isNumeric
                                    >
                                        <HStack spacing={2} justify="flex-end">
                                            <Text>Miqdor</Text>
                                            {sortColumn === "quantity" && (
                                                sortDirection === "asc" ? <ChevronUpIcon /> : <ChevronDownIcon />
                                            )}
                                        </HStack>
                                    </Th>
                                    <Th
                                        cursor="pointer"
                                        onClick={() => handleSort("totalValue")}
                                        _hover={{ bg: hoverBg }}
                                        isNumeric
                                    >
                                        <HStack spacing={2} justify="flex-end">
                                            <Text>Umumiy qiymat</Text>
                                            {sortColumn === "totalValue" && (
                                                sortDirection === "asc" ? <ChevronUpIcon /> : <ChevronDownIcon />
                                            )}
                                        </HStack>
                                    </Th>
                                    <Th>Barcode</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {paginatedStocks.map((stock, index) => {
                                    const isLowStock = stock.quantity < 10;
                                    const batchAgeColor = getBatchAgeColor(stock.batchAge);

                                    return (
                                        <Tr
                                            key={`${stock.productId}-${stock.batch}-${index}`}
                                            // bg={isLowStock ? "red.50" : undefined}
                                            _hover={{ bg: hoverBg }}
                                        >
                                            {/* PRODUCT NAME */}
                                            <Td>
                                                <VStack align="start" spacing={0}>
                                                    <Text fontWeight="medium">
                                                        {highlightText(stock.productName, search)}
                                                    </Text>
                                                    {isLowStock && (
                                                        <Badge colorScheme="red" fontSize="xs">
                                                            Kam qolgan
                                                        </Badge>
                                                    )}
                                                </VStack>
                                            </Td>

                                            {/* UNIT */}
                                            <Td>
                                                <Text fontSize="sm">{stock.unit}</Text>
                                            </Td>

                                            {/* BATCH */}
                                            <Td>
                                                <Tooltip
                                                    label={stock.batchAge ? `${stock.batchAge} kun oldin` : ""}
                                                    placement="top"
                                                >
                                                    <Badge colorScheme={batchAgeColor} fontSize="xs">
                                                        {stock.batch}
                                                    </Badge>
                                                </Tooltip>
                                            </Td>

                                            {/* PURCHASE PRICE */}
                                            <Td isNumeric>
                                                <Text fontSize="sm">{formatNumber(stock.purchasePrice)}</Text>
                                            </Td>

                                            {/* SALE PRICE */}
                                            <Td isNumeric>
                                                <Text fontSize="sm">{formatNumber(stock.salePrice)}</Text>
                                            </Td>

                                            {/* QUANTITY */}
                                            <Td isNumeric>
                                                <Text
                                                    fontSize="sm"
                                                    fontWeight="medium"
                                                    color={isLowStock ? "red.500" : "gray.600"}
                                                >
                                                    {stock.quantity}
                                                </Text>
                                            </Td>

                                            {/* TOTAL VALUE */}
                                            <Td isNumeric>
                                                <Text fontSize="sm" fontWeight="bold" color="blue.600">
                                                    {formatNumber(stock.totalValue)}
                                                </Text>
                                            </Td>

                                            {/* BARCODE */}
                                            <Td>
                                                <Text fontSize="xs" color="gray.500">
                                                    {stock.barcode || "—"}
                                                </Text>
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </Tbody>
                        </Table>
                    </Box>

                    {/* CARDS - MOBILE/TABLET */}
                    <Stack
                        spacing={4}
                        display={{ base: "flex", lg: "none" }}
                        mb={6}
                    >
                        {paginatedStocks.map((stock, index) => {
                            const isLowStock = stock.quantity < 10;
                            const batchAgeColor = getBatchAgeColor(stock.batchAge);

                            return (
                                <Card
                                    key={`${stock.productId}-${stock.batch}-${index}`}
                                    bg={isLowStock ? "dangerBg" : cardBg}
                                    borderColor={isLowStock ? "red.200" : borderColor}
                                >
                                    <CardBody>
                                        <VStack align="stretch" spacing={3}>
                                            {/* HEADER */}
                                            <Flex justify="space-between" align="start">
                                                <VStack align="start" spacing={1} flex={1}>
                                                    <Text fontWeight="bold" fontSize="lg">
                                                        {highlightText(stock.productName, search)}
                                                    </Text>
                                                    <HStack spacing={2}>
                                                        <Badge colorScheme="gray">{stock.unit}</Badge>
                                                        {isLowStock && (
                                                            <Badge colorScheme="red">Kam qolgan</Badge>
                                                        )}
                                                    </HStack>
                                                </VStack>
                                            </Flex>

                                            <Divider />

                                            {/* DETAILS */}
                                            <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                                                <Box>
                                                    <Text fontSize="xs" color="gray.500" mb={1}>
                                                        Partiya
                                                    </Text>
                                                    <Badge colorScheme={batchAgeColor}>
                                                        {stock.batch}
                                                    </Badge>
                                                </Box>

                                                <Box>
                                                    <Text fontSize="xs" color="gray.500" mb={1}>
                                                        Miqdor
                                                    </Text>
                                                    <Text
                                                        fontWeight="medium"
                                                        color={isLowStock ? "red.500" : "gray.600"}
                                                    >
                                                        {stock.quantity} {stock.unit}
                                                    </Text>
                                                </Box>

                                                <Box>
                                                    <Text fontSize="xs" color="gray.500" mb={1}>
                                                        Xarid narxi
                                                    </Text>
                                                    <Text fontSize="sm">
                                                        {formatNumber(stock.purchasePrice)} so'm
                                                    </Text>
                                                </Box>

                                                <Box>
                                                    <Text fontSize="xs" color="gray.500" mb={1}>
                                                        Sotuv narxi
                                                    </Text>
                                                    <Text fontSize="sm">
                                                        {formatNumber(stock.salePrice)} so'm
                                                    </Text>
                                                </Box>
                                            </Grid>

                                            <Divider />

                                            {/* TOTAL */}
                                            <Flex justify="space-between" align="center">
                                                <Text fontSize="sm" color="gray.500">
                                                    Umumiy qiymat:
                                                </Text>
                                                <Text fontSize="lg" fontWeight="bold" color="blue.600">
                                                    {formatNumber(stock.totalValue)} so'm
                                                </Text>
                                            </Flex>

                                            {stock.barcode && (
                                                <>
                                                    <Divider />
                                                    <HStack justify="space-between">
                                                        <Text fontSize="xs" color="gray.500">
                                                            Barcode:
                                                        </Text>
                                                        <Text fontSize="xs">{stock.barcode}</Text>
                                                    </HStack>
                                                </>
                                            )}
                                        </VStack>
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </Stack>

                    {/* PAGINATION */}
                    <Card bg={cardBg} borderColor={borderColor}>
                        <CardBody>
                            <Flex
                                justify="space-between"
                                align="center"
                                flexDir={{ base: "column", md: "row" }}
                                gap={4}
                            >
                                {/* ITEMS PER PAGE */}
                                <HStack spacing={2}>
                                    <Text fontSize="sm" color="gray.600">
                                        Sahifada:
                                    </Text>
                                    <Select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        size="sm"
                                        maxW="100px"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </Select>
                                </HStack>

                                {/* PAGE INFO */}
                                <Text fontSize="sm" color="gray.600">
                                    {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedStocks.length)} / {sortedStocks.length}
                                </Text>

                                {/* PAGE NAVIGATION */}
                                <HStack spacing={2}>
                                    <Button
                                        display={{ base: 'none', md: 'block' }}
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
                                        {currentPage} / {totalPages}
                                    </Text>
                                    <Button
                                        size="sm"
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        isDisabled={currentPage === totalPages}
                                    >
                                        Keyingi
                                    </Button>
                                    <Button
                                        display={{ base: 'none', md: 'block' }}
                                        size="sm"
                                        onClick={() => setCurrentPage(totalPages)}
                                        isDisabled={currentPage === totalPages}
                                    >
                                        Oxirgi
                                    </Button>
                                </HStack>
                            </Flex>
                        </CardBody>
                    </Card>
                </>
            )}

            {/* PRINT STYLES */}
            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .chakra-table,
          .chakra-table * {
            visibility: visible;
          }
          
          .chakra-table {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          .chakra-button,
          .chakra-input,
          .chakra-select {
            display: none !important;
          }
        }
      `}</style>
        </Box>
    );
}