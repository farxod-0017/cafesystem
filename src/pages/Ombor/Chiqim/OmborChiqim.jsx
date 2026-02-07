import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
    Box,
    Flex,
    Heading,
    Text,
    Button,
    IconButton,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerCloseButton,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Input,
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
    Divider,
    Skeleton,
    SkeletonText,
    Badge,
    Tooltip,
    useToast,
    FormControl,
    FormLabel,
    Textarea,
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
    Switch,
    FormHelperText,
} from "@chakra-ui/react";
import {
    DeleteIcon,
    SearchIcon,
    AddIcon,
    CheckIcon,
    InfoIcon,
    WarningIcon,
} from "@chakra-ui/icons";
import { apiLocations } from "../../../utils/Controllers/apiLocations";
import { apiStock } from "../../../utils/Controllers/Stock";
import { apiInvoices } from "../../../utils/Controllers/Invoices";
import { useWarehouseStore } from "../../../store/useWarehouseStore";
import Cookies from "js-cookie";

// ==============================
// UTILITY FUNCTIONS
// ==============================

// Get user ID from cookie
const getUserId = () => {
    return Cookies.get("user_id");
};

// Normalize stock response (faqat stocklar keladi)
const normalizeStock = (stock) => {
    return {
        id: stock.product.id,
        productId: stock.productId,
        name: stock.product.name,
        unit: stock.product.unit,
        purchasePrice: parseFloat(stock.purchasePrice) || 0, // Backend uchun, UI da ko'rinmaydi
        salePrice: parseFloat(stock.salePrice) || 0,
        availableQuantity: parseFloat(stock.quantity) || 0, // Omborda qolgan
        batch: stock.batch,
        barcode: stock.barcode || "",
        // UI uchun
        quantity: 1, // Default 1
        discount: 0, // Default 0%
    };
};

// Format number with spaces
const formatNumber = (num) => {
    return num?.toLocaleString("uz-UZ") || "0";
};

// Format date for display
const formatDate = () => {
    const now = new Date();
    return now.toLocaleString("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// Sort batches by date (FIFO - eski birinchi)
const sortByBatch = (stocks) => {
    return [...stocks].sort((a, b) => {
        // Batch format: YYYYMMDD-PRICE-SEQ
        const dateA = a.batch?.split("-")[0] || "99999999";
        const dateB = b.batch?.split("-")[0] || "99999999";
        return dateA.localeCompare(dateB);
    });
};

// ==============================
// MAIN COMPONENT
// ==============================

export default function OmborChiqim() {
    const toast = useToast();
    const sidebar = useDisclosure();
    const modal = useDisclosure();
    const searchInputRef = useRef(null);

    const { mainWarehouseId, locationName } = useWarehouseStore();

    // ==============================
    // STATE MANAGEMENT
    // ==============================

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [clients, setClients] = useState([]);
    const [stocks, setStocks] = useState([]);
    const [selectedClient, setSelectedClient] = useState("");
    const [note, setNote] = useState("");
    const [isDiscountEnabled, setIsDiscountEnabled] = useState(false);

    // Loading states
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [isLoadingStocks, setIsLoadingStocks] = useState(false);
    const [isLoadingDrawer, setIsLoadingDrawer] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ==============================
    // FETCH CLIENTS
    // ==============================

    const fetchClients = async () => {
        if (!mainWarehouseId) return;
        setIsLoadingClients(true);
        try {
            const response = await apiLocations.getLocalLocationsByType("client", mainWarehouseId);
            setClients(response.data || []);
        } finally {
            setIsLoadingClients(false);
        }
    };

    useEffect(() => {
        fetchClients();
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

    // ==============================
    // FETCH STOCKS (SEARCH)
    // ==============================

    useEffect(() => {
        if (debouncedSearch.length >= 3) {
            fetchStocks(debouncedSearch);
        } else if (debouncedSearch.length === 0) {
            setStocks([]);
        }
    }, [debouncedSearch]);

    const fetchStocks = async (searchText) => {
        setIsLoadingStocks(true);
        try {
            const response = await apiStock.getStocksForOperationById(
                mainWarehouseId,
                searchText || "",
                "outgoing"
            );
            const normalized = (response.data || []).map(normalizeStock);
            const sorted = sortByBatch(normalized); // FIFO sort
            setStocks(sorted);
        } finally {
            setIsLoadingStocks(false);
        }
    };

    // ==============================
    // FETCH ALL STOCKS (DRAWER)
    // ==============================

    const handleOpenDrawer = async () => {
        sidebar.onOpen();
        setIsLoadingDrawer(true);
        try {
            const response = await apiStock.getStocksForOperationById(
                mainWarehouseId,
                "", // Empty = all stocks
                "outgoing"
            );
            const normalized = (response.data || []).map(normalizeStock);
            const sorted = sortByBatch(normalized); // FIFO sort
            setStocks(sorted);
        } finally {
            setIsLoadingDrawer(false);
        }
    };

    // ==============================
    // ADD STOCK TO TABLE
    // ==============================

    const addStock = useCallback((stock) => {
        // Check if same stock+batch already added
        if (selectedItems.find((item) =>
            item.id === stock.id && item.batch === stock.batch
        )) {
            toast({
                title: "Mahsulot allaqachon qo'shilgan",
                status: "warning",
                duration: 2000,
                isClosable: true,
                position: "top",
            });
            return;
        }

        setSelectedItems((prev) => [...prev, { ...stock }]);

        // Close drawer if open
        if (sidebar.isOpen) {
            sidebar.onClose();
        }

        // Clear search
        setSearch("");
        setStocks([]);
    }, [selectedItems, sidebar, toast]);

    // ==============================
    // UPDATE QUANTITY (with validation)
    // ==============================

    const updateQuantity = (id, batch, value) => {
        const qty = parseFloat(value) || 0;

        setSelectedItems((prev) =>
            prev.map((item) => {
                if (item.id === id && item.batch === batch) {
                    // Auto-correct to max available
                    if (qty > item.availableQuantity) {
                        toast({
                            title: "Diqqat",
                            description: `Omborda faqat ${item.availableQuantity} ${item.unit} bor. Avtomatik to'g'rilandi.`,
                            status: "warning",
                            duration: 3000,
                            isClosable: true,
                            position: "top",
                        });
                        return { ...item, quantity: item.availableQuantity };
                    }
                    return { ...item, quantity: qty };
                }
                return item;
            })
        );
    };

    // ==============================
    // UPDATE SALE PRICE
    // ==============================

    const updateSalePrice = (id, batch, value) => {
        const price = parseFloat(value) || 0;
        setSelectedItems((prev) =>
            prev.map((item) =>
                item.id === id && item.batch === batch
                    ? { ...item, salePrice: price }
                    : item
            )
        );
    };

    // ==============================
    // UPDATE DISCOUNT
    // ==============================

    const updateDiscount = (id, batch, value) => {
        let discount = parseFloat(value) || 0;

        // Max 100%
        if (discount > 100) {
            discount = 100;
            toast({
                title: "Diqqat",
                description: "Chegirma 100% dan oshmasligi kerak",
                status: "warning",
                duration: 2000,
                isClosable: true,
                position: "top",
            });
        }

        setSelectedItems((prev) =>
            prev.map((item) =>
                item.id === id && item.batch === batch
                    ? { ...item, discount }
                    : item
            )
        );
    };

    // ==============================
    // REMOVE ITEM
    // ==============================

    const removeItem = (id, batch) => {
        setSelectedItems((prev) =>
            prev.filter((item) => !(item.id === id && item.batch === batch))
        );
    };

    // ==============================
    // CALCULATIONS
    // ==============================

    const calculateItemTotal = (item) => {
        const subtotal = item.salePrice * item.quantity;
        const discountAmount = subtotal * (item.discount / 100);
        return subtotal - discountAmount;
    };

    const totalAmount = useMemo(() => {
        return selectedItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    }, [selectedItems]);

    const totalDiscount = useMemo(() => {
        return selectedItems.reduce((sum, item) => {
            const subtotal = item.salePrice * item.quantity;
            const discountAmount = subtotal * (item.discount / 100);
            return sum + discountAmount;
        }, 0);
    }, [selectedItems]);

    const totalItems = selectedItems.length;

    const averagePrice = useMemo(() => {
        if (totalItems === 0) return 0;
        const totalQty = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
        return totalAmount / totalQty;
    }, [totalAmount, totalItems, selectedItems]);

    // ==============================
    // VALIDATION
    // ==============================

    const validateForm = () => {
        if (!selectedClient) {
            toast({
                title: "Xatolik",
                description: "Mijozni tanlang",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
            return false;
        }

        if (selectedItems.length === 0) {
            toast({
                title: "Xatolik",
                description: "Kamida bitta mahsulot qo'shing",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
            return false;
        }

        for (const item of selectedItems) {
            if (item.salePrice <= 0) {
                toast({
                    title: "Xatolik",
                    description: `"${item.name}" (${item.batch}) uchun sotuv narxini kiriting`,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                    position: "top",
                });
                return false;
            }

            if (item.quantity < 1) {
                toast({
                    title: "Xatolik",
                    description: `"${item.name}" (${item.batch}) uchun miqdor kamida 1 bo'lishi kerak`,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                    position: "top",
                });
                return false;
            }

            if (item.quantity > item.availableQuantity) {
                toast({
                    title: "Xatolik",
                    description: `"${item.name}" (${item.batch}) - omborda faqat ${item.availableQuantity} ${item.unit} bor`,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                    position: "top",
                });
                return false;
            }
        }

        return true;
    };

    // ==============================
    // SUBMIT INVOICE
    // ==============================

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const userId = getUserId();

            const payload = {
                type: selectedClient === "disposal" ? "disposal" : "outgoing",
                senderId: mainWarehouseId, // Bizning ombor
                receiverId: selectedClient === "disposal" ? mainWarehouseId : selectedClient, // Mijoz
                createdBy: userId,
                status: "sent",
                note: note || "",
                items: selectedItems.map((item) => ({
                    productId: item.id,
                    quantity: item.quantity,
                    salePrice: item.salePrice,
                    purchasePrice: item.purchasePrice, // Stock dan, UI da ko'rinmaydi
                    discount: isDiscountEnabled ? item.discount : 0,
                    batch: item.batch,
                    isNewBatch: false
                })),
            };

            await apiInvoices.Add(payload);

            // Success - reset form
            setSelectedItems([]);
            setSelectedClient("");
            setNote("");
            setIsDiscountEnabled(false);
            modal.onClose();

            toast({
                title: "Muvaffaqiyatli",
                description: "Chiqim hujjati yaratildi",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top",
            });

        } finally {
            setIsSubmitting(false);
        }
    };

    // ==============================
    // KEYBOARD SHORTCUTS
    // ==============================

    useEffect(() => {
        const handleKeyDown = (e) => {
            // ESC - close modal/drawer
            if (e.key === "Escape") {
                if (modal.isOpen) modal.onClose();
                if (sidebar.isOpen) sidebar.onClose();
            }

            // ENTER - add first search result
            if (e.key === "Enter" && stocks.length > 0 && !sidebar.isOpen && !modal.isOpen) {
                addStock(stocks[0]);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [stocks, modal, sidebar, addStock]);

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
                <Heading size={{ base: "md", md: "lg" }}>
                    Ombordan chiqim
                </Heading>
                <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    onClick={handleOpenDrawer}
                    size={{ base: "sm", md: "md" }}
                >
                    Mahsulotlar
                </Button>
            </Flex>

            {/* META INFO - CLIENT & WAREHOUSE */}
            <Grid
                templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                gap={4}
                mb={6}
            >
                <GridItem>
                    <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="medium">
                            Qabul qiluvchi (mijoz)
                        </FormLabel>
                        {isLoadingClients ? (
                            <Skeleton height="40px" borderRadius="md" />
                        ) : (
                            <Select
                                placeholder="Tanlang..."
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                bg={inputBg}
                                borderColor={borderColor}
                                _hover={{ borderColor: "blue.400" }}
                                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                            >
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                                <option value="disposal">UTILIZATSIYA</option>
                            </Select>
                        )}
                    </FormControl>
                </GridItem>

                <GridItem>
                    <FormControl>
                        <FormLabel fontSize="sm" fontWeight="medium">
                            Jo'natuvchi ombor
                        </FormLabel>
                        <Input
                            value={locationName}
                            isReadOnly
                            bg={inputBg}
                            borderColor={borderColor}
                            cursor="not-allowed"
                            opacity={0.7}
                        />
                    </FormControl>
                </GridItem>
            </Grid>

            {/* NOTE & DISCOUNT TOGGLE */}
            <Stack spacing={4} mb={6}>
                <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">
                        Izoh (ixtiyoriy)
                    </FormLabel>
                    <Textarea
                        placeholder="Qo'shimcha ma'lumot..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        bg={inputBg}
                        borderColor={borderColor}
                        _hover={{ borderColor: "blue.400" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                        rows={3}
                    />
                </FormControl>
                {/* DISCOUNT TOGGLE */}
                {selectedClient !== "disposal" && (
                <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="discount-toggle" mb="0" fontSize="sm" fontWeight="medium">
                        Chegirma qo'llash
                    </FormLabel>
                    <Switch
                        id="discount-toggle"
                        colorScheme="blue"
                        isChecked={isDiscountEnabled}
                        onChange={(e) => setIsDiscountEnabled(e.target.checked)}
                    />
                    {isDiscountEnabled && (
                        <FormHelperText ml={3} mt={0} fontSize="xs" color="blue.500">
                            Har bir mahsulot uchun chegirma kiritish mumkin
                        </FormHelperText>
                    )}
                </FormControl>)}
            </Stack>

            {/* SEARCH */}
            <FormControl mb={4}>
                <FormLabel fontSize="sm" fontWeight="medium">
                    Mahsulot qidirish
                </FormLabel>
                <InputGroup>
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                        ref={searchInputRef}
                        placeholder="Mahsulot nomini kiriting (kamida 3 ta belgi)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        bg={inputBg}
                        borderColor={borderColor}
                        _hover={{ borderColor: "blue.400" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                    />
                </InputGroup>

                {search.length > 0 && search.length < 3 && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        Yana {3 - search.length} ta belgi kiriting
                    </Text>
                )}
            </FormControl>

            {/* SEARCH RESULTS */}
            {isLoadingStocks && (
                <Card mb={6} bg={cardBg} borderColor={borderColor}>
                    <CardBody>
                        <Stack spacing={3}>
                            {[1, 2, 3].map((i) => (
                                <SkeletonText key={i} noOfLines={2} spacing="2" />
                            ))}
                        </Stack>
                    </CardBody>
                </Card>
            )}

            {!isLoadingStocks && stocks.length > 0 && (
                <Card mb={6} bg={cardBg} borderColor={borderColor}>
                    <CardBody p={0}>
                        {stocks.slice(0, 10).map((stock, index) => (
                            <Flex
                                key={`${stock.id}-${stock.batch}`}
                                p={3}
                                justify="space-between"
                                align="center"
                                borderBottom={index < 9 ? "1px solid" : "none"}
                                borderColor={borderColor}
                                cursor="pointer"
                                _hover={{ bg: hoverBg }}
                                onClick={() => addStock(stock)}
                                transition="background 0.2s"
                            >
                                <VStack align="start" spacing={1} flex={1}>
                                    <Text fontWeight="medium">{stock.name}</Text>
                                    <HStack spacing={2} fontSize="sm">
                                        <Badge colorScheme="purple" fontSize="xs">
                                            {stock.batch}
                                        </Badge>
                                        <Text color="gray.500">
                                            Omborda: {stock.availableQuantity} {stock.unit}
                                        </Text>
                                    </HStack>
                                </VStack>

                                <VStack align="end" spacing={0}>
                                    <Text fontSize="sm" fontWeight="medium">
                                        {formatNumber(stock.salePrice)} so'm
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                        Sotuv narxi
                                    </Text>
                                </VStack>
                            </Flex>
                        ))}

                        {stocks.length > 10 && (
                            <Flex p={3} justify="center" borderTop="1px solid" borderColor={borderColor}>
                                <Text fontSize="sm" color="gray.500">
                                    va yana {stocks.length - 10} ta mahsulot
                                </Text>
                            </Flex>
                        )}
                    </CardBody>
                </Card>
            )}

            {!isLoadingStocks && search.length >= 3 && stocks.length === 0 && (
                <Alert status="info" mb={6} borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>
                        "{search}" bo'yicha natija topilmadi
                    </AlertDescription>
                </Alert>
            )}

            {/* SELECTED ITEMS TABLE */}
            {selectedItems.length === 0 ? (
                <Card bg={cardBg} borderColor={borderColor}>
                    <CardBody>
                        <Center py={10}>
                            <VStack spacing={3}>
                                <InfoIcon boxSize={12} color="gray.400" />
                                <Text fontSize="lg" fontWeight="medium" color="gray.500">
                                    Mahsulot tanlanmagan
                                </Text>
                                <Text fontSize="sm" color="gray.400" textAlign="center">
                                    Mahsulot qidirish yoki "Mahsulotlar" tugmasidan tanlang
                                </Text>
                            </VStack>
                        </Center>
                    </CardBody>
                </Card>
            ) : (
                <>
                    {/* SUMMARY CARDS */}
                    <Grid
                        templateColumns={{ base: "1fr", sm: isDiscountEnabled ? "repeat(4, 1fr)" : "repeat(3, 1fr)" }}
                        gap={4}
                        mb={4}
                    >
                        <Card bg={cardBg} borderColor={borderColor}>
                            <CardBody>
                                <Text fontSize="sm" color="gray.500" mb={1}>
                                    Jami mahsulotlar
                                </Text>
                                <Text fontSize="2xl" fontWeight="bold">
                                    {totalItems} ta
                                </Text>
                            </CardBody>
                        </Card>

                        <Card bg={cardBg} borderColor={borderColor}>
                            <CardBody>
                                <Text fontSize="sm" color="gray.500" mb={1}>
                                    Umumiy summa
                                </Text>
                                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                    {formatNumber(totalAmount)} so'm
                                </Text>
                            </CardBody>
                        </Card>

                        {isDiscountEnabled && totalDiscount > 0 && (
                            <Card bg={cardBg} borderColor={borderColor}>
                                <CardBody>
                                    <Text fontSize="sm" color="gray.500" mb={1}>
                                        Jami chegirma
                                    </Text>
                                    <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                                        {formatNumber(totalDiscount)} so'm
                                    </Text>
                                </CardBody>
                            </Card>
                        )}

                        <Card bg={cardBg} borderColor={borderColor}>
                            <CardBody>
                                <Text fontSize="sm" color="gray.500" mb={1}>
                                    O'rtacha narx
                                </Text>
                                <Text fontSize="2xl" fontWeight="bold">
                                    {formatNumber(Math.round(averagePrice))} so'm
                                </Text>
                            </CardBody>
                        </Card>
                    </Grid>

                    {/* TABLE - DESKTOP */}
                    <Box
                        display={{ base: "none", lg: "block" }}
                        overflowX="auto"
                        bg={cardBg}
                        borderRadius="xl"
                        border="1px solid"
                        borderColor={borderColor}
                    >
                        <Table size="sm">
                            <Thead>
                                <Tr>
                                    <Th>Nomlanishi</Th>
                                    <Th>Partiya</Th>
                                    <Th>Omborda</Th>
                                    <Th>Sotuv narxi (so'm)</Th>
                                    {isDiscountEnabled && <Th>Chegirma (%)</Th>}
                                    <Th>Miqdor</Th>
                                    <Th>Birlik</Th>
                                    <Th>Jami (so'm)</Th>
                                    <Th></Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {selectedItems.map((item) => {
                                    const total = calculateItemTotal(item);
                                    const remaining = item.availableQuantity - item.quantity;
                                    const isLowStock = remaining < 10;

                                    return (
                                        <Tr key={`${item.id}-${item.batch}`}>
                                            {/* NAME */}
                                            <Td>
                                                <Text fontWeight="medium">{item.name}</Text>
                                            </Td>

                                            {/* BATCH */}
                                            <Td>
                                                <Badge colorScheme="purple" fontSize="xs">
                                                    {item.batch}
                                                </Badge>
                                            </Td>

                                            {/* AVAILABLE QUANTITY */}
                                            <Td>
                                                <VStack align="start" spacing={0}>
                                                    <Text
                                                        fontSize="sm"
                                                        fontWeight="medium"
                                                        color={isLowStock ? "orange.500" : "gray.600"}
                                                    >
                                                        {item.availableQuantity} {item.unit}
                                                    </Text>
                                                    <Text fontSize="xs" color="gray.500">
                                                        Qoladi: {remaining} {item.unit}
                                                    </Text>
                                                </VStack>
                                            </Td>

                                            {/* SALE PRICE */}
                                            <Td>
                                                <Input
                                                    type="number"
                                                    value={item.salePrice || ""}
                                                    onChange={(e) =>
                                                        updateSalePrice(item.id, item.batch, e.target.value)
                                                    }
                                                    placeholder="0"
                                                    size="sm"
                                                    maxW="120px"
                                                    bg={inputBg}
                                                    borderColor={borderColor}
                                                    _focus={{
                                                        borderColor: "blue.500",
                                                        boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                                                    }}
                                                />
                                            </Td>

                                            {/* DISCOUNT (if enabled) */}
                                            {isDiscountEnabled && (
                                                <Td>
                                                    <VStack align="start" spacing={1}>
                                                        <Input
                                                            type="number"
                                                            value={item.discount || ""}
                                                            onChange={(e) =>
                                                                updateDiscount(item.id, item.batch, e.target.value)
                                                            }
                                                            placeholder="0"
                                                            size="sm"
                                                            maxW="90px"
                                                            max={100}
                                                            bg={inputBg}
                                                            borderColor={borderColor}
                                                            _focus={{
                                                                borderColor: "blue.500",
                                                                boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                                                            }}
                                                        />
                                                        {item.discount > 0 && (
                                                            <Text fontSize="xs" color="orange.500">
                                                                -{formatNumber(item.salePrice * item.quantity * (item.discount / 100))} so'm
                                                            </Text>
                                                        )}
                                                    </VStack>
                                                </Td>
                                            )}

                                            {/* QUANTITY */}
                                            <Td>
                                                <Input
                                                    type="number"
                                                    value={item.quantity || ""}
                                                    onChange={(e) =>
                                                        updateQuantity(item.id, item.batch, e.target.value)
                                                    }
                                                    placeholder="1"
                                                    size="sm"
                                                    maxW="90px"
                                                    max={item.availableQuantity}
                                                    bg={inputBg}
                                                    borderColor={item.quantity > item.availableQuantity ? "red.400" : borderColor}
                                                    _focus={{
                                                        borderColor: "blue.500",
                                                        boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                                                    }}
                                                />
                                            </Td>

                                            {/* UNIT */}
                                            <Td>
                                                <Text color="gray.600" fontSize="sm">
                                                    {item.unit}
                                                </Text>
                                            </Td>

                                            {/* TOTAL */}
                                            <Td>
                                                <VStack align="end" spacing={0}>
                                                    <Text fontWeight="bold" color="blue.600">
                                                        {formatNumber(total)}
                                                    </Text>
                                                    {isDiscountEnabled && item.discount > 0 && (
                                                        <Text fontSize="xs" color="gray.500" textDecoration="line-through">
                                                            {formatNumber(item.salePrice * item.quantity)}
                                                        </Text>
                                                    )}
                                                </VStack>
                                            </Td>

                                            {/* DELETE */}
                                            <Td>
                                                <Tooltip label="O'chirish">
                                                    <IconButton
                                                        icon={<DeleteIcon />}
                                                        size="sm"
                                                        colorScheme="red"
                                                        variant="ghost"
                                                        onClick={() => removeItem(item.id, item.batch)}
                                                        aria-label="O'chirish"
                                                    />
                                                </Tooltip>
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </Tbody>
                        </Table>
                    </Box>

                    {/* MOBILE/TABLET CARDS */}
                    <Stack
                        spacing={4}
                        display={{ base: "flex", lg: "none" }}
                    >
                        {selectedItems.map((item) => {
                            const total = calculateItemTotal(item);
                            const remaining = item.availableQuantity - item.quantity;
                            const isLowStock = remaining < 10;

                            return (
                                <Card key={`${item.id}-${item.batch}`} bg={cardBg} borderColor={borderColor}>
                                    <CardBody>
                                        <Flex justify="space-between" align="start" mb={3}>
                                            <VStack align="start" spacing={1} flex={1}>
                                                <Text fontWeight="bold" fontSize="lg">
                                                    {item.name}
                                                </Text>
                                                <HStack spacing={2}>
                                                    <Badge colorScheme="purple">{item.batch}</Badge>
                                                    <Badge colorScheme="gray">{item.unit}</Badge>
                                                </HStack>
                                            </VStack>

                                            <IconButton
                                                icon={<DeleteIcon />}
                                                size="sm"
                                                colorScheme="red"
                                                variant="ghost"
                                                onClick={() => removeItem(item.id, item.batch)}
                                                aria-label="O'chirish"
                                            />
                                        </Flex>

                                        <Divider mb={3} />

                                        {/* AVAILABLE */}
                                        <HStack justify="space-between" mb={3}>
                                            <Text fontSize="sm" color="gray.500">
                                                Omborda:
                                            </Text>
                                            <Text
                                                fontSize="sm"
                                                fontWeight="medium"
                                                color={isLowStock ? "orange.500" : "gray.600"}
                                            >
                                                {item.availableQuantity} {item.unit}
                                            </Text>
                                        </HStack>

                                        {/* SALE PRICE */}
                                        <FormControl mb={3}>
                                            <FormLabel fontSize="sm">Sotuv narxi (so'm)</FormLabel>
                                            <Input
                                                type="number"
                                                value={item.salePrice || ""}
                                                onChange={(e) =>
                                                    updateSalePrice(item.id, item.batch, e.target.value)
                                                }
                                                placeholder="0"
                                                bg={inputBg}
                                                borderColor={borderColor}
                                            />
                                        </FormControl>

                                        {/* DISCOUNT (if enabled) */}
                                        {isDiscountEnabled && (
                                            <FormControl mb={3}>
                                                <FormLabel fontSize="sm">Chegirma (%)</FormLabel>
                                                <Input
                                                    type="number"
                                                    value={item.discount || ""}
                                                    onChange={(e) =>
                                                        updateDiscount(item.id, item.batch, e.target.value)
                                                    }
                                                    placeholder="0"
                                                    max={100}
                                                    bg={inputBg}
                                                    borderColor={borderColor}
                                                />
                                                {item.discount > 0 && (
                                                    <Text fontSize="xs" color="orange.500" mt={1}>
                                                        -{formatNumber(item.salePrice * item.quantity * (item.discount / 100))} so'm
                                                    </Text>
                                                )}
                                            </FormControl>
                                        )}

                                        {/* QUANTITY */}
                                        <FormControl mb={3}>
                                            <FormLabel fontSize="sm">Miqdor</FormLabel>
                                            <Input
                                                type="number"
                                                value={item.quantity || ""}
                                                onChange={(e) =>
                                                    updateQuantity(item.id, item.batch, e.target.value)
                                                }
                                                placeholder="1"
                                                max={item.availableQuantity}
                                                bg={inputBg}
                                                borderColor={item.quantity > item.availableQuantity ? "red.400" : borderColor}
                                            />
                                            <Text fontSize="xs" color="gray.500" mt={1}>
                                                Qoladi: {remaining} {item.unit}
                                            </Text>
                                        </FormControl>

                                        {/* TOTAL */}
                                        <Divider mb={3} />
                                        <Flex justify="space-between" align="center">
                                            <Text fontSize="sm" color="gray.500">
                                                Jami:
                                            </Text>
                                            <VStack align="end" spacing={0}>
                                                <Text fontSize="xl" fontWeight="bold" color="blue.600">
                                                    {formatNumber(total)} so'm
                                                </Text>
                                                {isDiscountEnabled && item.discount > 0 && (
                                                    <Text fontSize="xs" color="gray.500" textDecoration="line-through">
                                                        {formatNumber(item.salePrice * item.quantity)} so'm
                                                    </Text>
                                                )}
                                            </VStack>
                                        </Flex>
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </Stack>
                </>
            )}

            {/* FOOTER - SUBMIT BUTTON */}
            {selectedItems.length > 0 && (
                <Flex justify="flex-end" mt={6} gap={3}>
                    <Button
                        colorScheme="blue"
                        size="lg"
                        onClick={() => {
                            if (validateForm()) {
                                modal.onOpen();
                            }
                        }}
                        leftIcon={<CheckIcon />}
                    >
                        Yakunlash
                    </Button>
                </Flex>
            )}

            {/* DRAWER - ALL STOCKS */}
            <Drawer
                isOpen={sidebar.isOpen}
                placement="left"
                onClose={sidebar.onClose}
                size="md"
            >
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader borderBottomWidth="1px">
                        Barcha mahsulotlar
                    </DrawerHeader>
                    <DrawerBody p={0}>
                        {isLoadingDrawer ? (
                            <Stack spacing={3} p={4}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <SkeletonText key={i} noOfLines={2} spacing="2" />
                                ))}
                            </Stack>
                        ) : stocks.length === 0 ? (
                            <Center py={10}>
                                <VStack spacing={3}>
                                    <WarningIcon boxSize={10} color="gray.400" />
                                    <Text color="gray.500">Mahsulot topilmadi</Text>
                                </VStack>
                            </Center>
                        ) : (
                            <>
                                <Box p={3} borderBottomWidth="1px" bg={hoverBg}>
                                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                                        Jami: {stocks.length} ta mahsulot
                                    </Text>
                                </Box>

                                {stocks.map((stock, index) => (
                                    <Flex
                                        key={`${stock.id}-${stock.batch}`}
                                        p={4}
                                        borderBottom={index < stocks.length - 1 ? "1px solid" : "none"}
                                        borderColor={borderColor}
                                        cursor="pointer"
                                        _hover={{ bg: hoverBg }}
                                        onClick={() => addStock(stock)}
                                        transition="background 0.2s"
                                    >
                                        <VStack align="start" spacing={1} flex={1}>
                                            <Text fontWeight="medium">{stock.name}</Text>
                                            <HStack spacing={2}>
                                                <Badge colorScheme="purple" fontSize="xs">
                                                    {stock.batch}
                                                </Badge>
                                                <Badge colorScheme="gray" fontSize="xs">
                                                    {stock.unit}
                                                </Badge>
                                            </HStack>
                                            <HStack spacing={3} fontSize="sm" color="gray.500">
                                                <Text>Omborda: {stock.availableQuantity}</Text>
                                                <Text>Narx: {formatNumber(stock.salePrice)} so'm</Text>
                                            </HStack>
                                        </VStack>
                                    </Flex>
                                ))}
                            </>
                        )}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

            {/* MODAL - CONFIRMATION */}
            <Modal
                isOpen={modal.isOpen}
                onClose={modal.onClose}
                size={{ base: "full", md: "4xl" }}
                scrollBehavior="inside"
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader borderBottomWidth="1px">
                        Hujjatni tasdiqlash
                    </ModalHeader>
                    <ModalBody py={6}>
                        <VStack align="stretch" spacing={4}>
                            {/* DOCUMENT INFO */}
                            <Card bg={cardBg} borderColor={borderColor}>
                                <CardBody>
                                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                        <Box>
                                            <Text fontSize="sm" color="gray.500" mb={1}>
                                                Hujjat
                                            </Text>
                                            <Text fontWeight="medium">Ombordan chiqim</Text>
                                        </Box>

                                        <Box>
                                            <Text fontSize="sm" color="gray.500" mb={1}>
                                                Sana
                                            </Text>
                                            <Text fontWeight="medium">{formatDate()}</Text>
                                        </Box>

                                        <Box>
                                            <Text fontSize="sm" color="gray.500" mb={1}>
                                                Jo'natuvchi
                                            </Text>
                                            <Text fontWeight="medium">{locationName}</Text>
                                        </Box>

                                        <Box>
                                            <Text fontSize="sm" color="gray.500" mb={1}>
                                                Qabul qiluvchi
                                            </Text>
                                            <Text fontWeight="medium">
                                                {clients.find((c) => c.id === selectedClient)?.name || "-"}
                                            </Text>
                                        </Box>
                                    </Grid>

                                    {note && (
                                        <>
                                            <Divider my={4} />
                                            <Box>
                                                <Text fontSize="sm" color="gray.500" mb={1}>
                                                    Izoh
                                                </Text>
                                                <Text>{note}</Text>
                                            </Box>
                                        </>
                                    )}
                                </CardBody>
                            </Card>

                            {/* SUMMARY */}
                            <Grid templateColumns={isDiscountEnabled && totalDiscount > 0 ? "repeat(4, 1fr)" : "repeat(3, 1fr)"} gap={4}>
                                <Card bg={cardBg} borderColor={borderColor}>
                                    <CardBody textAlign="center">
                                        <Text fontSize="sm" color="gray.500" mb={1}>
                                            Mahsulotlar
                                        </Text>
                                        <Text fontSize="2xl" fontWeight="bold">
                                            {totalItems}
                                        </Text>
                                    </CardBody>
                                </Card>

                                <Card bg={cardBg} borderColor={borderColor}>
                                    <CardBody textAlign="center">
                                        <Text fontSize="sm" color="gray.500" mb={1}>
                                            Umumiy summa
                                        </Text>
                                        <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                            {formatNumber(totalAmount)}
                                        </Text>
                                    </CardBody>
                                </Card>

                                {isDiscountEnabled && totalDiscount > 0 && (
                                    <Card bg={cardBg} borderColor={borderColor}>
                                        <CardBody textAlign="center">
                                            <Text fontSize="sm" color="gray.500" mb={1}>
                                                Chegirma
                                            </Text>
                                            <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                                                {formatNumber(totalDiscount)}
                                            </Text>
                                        </CardBody>
                                    </Card>
                                )}

                                <Card bg={cardBg} borderColor={borderColor}>
                                    <CardBody textAlign="center">
                                        <Text fontSize="sm" color="gray.500" mb={1}>
                                            O'rtacha
                                        </Text>
                                        <Text fontSize="2xl" fontWeight="bold">
                                            {formatNumber(Math.round(averagePrice))}
                                        </Text>
                                    </CardBody>
                                </Card>
                            </Grid>

                            {/* ITEMS TABLE */}
                            <Box overflowX="auto">
                                <Table size="sm" variant="simple">
                                    <Thead>
                                        <Tr>
                                            <Th>#</Th>
                                            <Th>Nomlanishi</Th>
                                            <Th>Partiya</Th>
                                            <Th isNumeric>Narx</Th>
                                            {isDiscountEnabled && <Th isNumeric>Chegirma</Th>}
                                            <Th isNumeric>Miqdor</Th>
                                            <Th>Birlik</Th>
                                            <Th isNumeric>Jami</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {selectedItems.map((item, index) => {
                                            const total = calculateItemTotal(item);
                                            return (
                                                <Tr key={`${item.id}-${item.batch}`}>
                                                    <Td>{index + 1}</Td>
                                                    <Td>
                                                        <Text fontWeight="medium">{item.name}</Text>
                                                    </Td>
                                                    <Td>
                                                        <Badge colorScheme="purple" fontSize="xs">
                                                            {item.batch}
                                                        </Badge>
                                                    </Td>
                                                    <Td isNumeric>{formatNumber(item.salePrice)}</Td>
                                                    {isDiscountEnabled && (
                                                        <Td isNumeric>
                                                            {item.discount > 0 ? (
                                                                <VStack align="end" spacing={0}>
                                                                    <Text fontWeight="medium">{item.discount}%</Text>
                                                                    <Text fontSize="xs" color="gray.500">
                                                                        -{formatNumber(item.salePrice * item.quantity * (item.discount / 100))}
                                                                    </Text>
                                                                </VStack>
                                                            ) : (
                                                                "-"
                                                            )}
                                                        </Td>
                                                    )}
                                                    <Td isNumeric>{item.quantity}</Td>
                                                    <Td>{item.unit}</Td>
                                                    <Td isNumeric fontWeight="bold">
                                                        {formatNumber(total)}
                                                    </Td>
                                                </Tr>
                                            );
                                        })}
                                    </Tbody>
                                </Table>
                            </Box>
                        </VStack>
                    </ModalBody>

                    <ModalFooter borderTopWidth="1px">
                        <HStack spacing={3} w="full" justify="flex-end">
                            <Button
                                variant="ghost"
                                onClick={modal.onClose}
                                isDisabled={isSubmitting}
                            >
                                Bekor qilish
                            </Button>

                            <Button
                                colorScheme="blue"
                                onClick={handleSubmit}
                                isLoading={isSubmitting}
                                loadingText="Saqlanmoqda..."
                                leftIcon={<CheckIcon />}
                            >
                                Saqlash
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => window.print()}
                                isDisabled={isSubmitting}
                            >
                                Chop etish
                            </Button>
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* PRINT STYLES */}
            <style jsx global>{`
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
          
          .chakra-button {
            display: none !important;
          }
        }
      `}</style>
        </Box>
    );
}