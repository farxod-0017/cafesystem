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
    Checkbox,
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
    AlertTitle,
    AlertDescription,
    Spinner,
    Center,
    Grid,
    GridItem,
    InputGroup,
    InputLeftElement,
    Card,
    CardBody,
    useColorModeValue,
} from "@chakra-ui/react";
import {
    DeleteIcon,
    SearchIcon,
    AddIcon,
    CheckIcon,
    CloseIcon,
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

// Normalize API response (Stock vs Product)
const normalizeProduct = (item) => {
    const isStock = !!item.productId; // Has productId means it's stock

    if (isStock) {
        return {
            id: item.product.id,
            name: item.product.name,
            unit: item.product.unit,
            purchasePrice: parseFloat(item.purchasePrice) || 0,
            salePrice: parseFloat(item.salePrice) || 0,
            quantity: parseFloat(item.quantity) || 0,
            batch: item.batch,
            barcode: item.barcode || "",
            isStock: true,
            originalPurchasePrice: parseFloat(item.purchasePrice) || 0, // For batch detection
        };
    } else {
        return {
            id: item.id,
            name: item.name,
            unit: item.unit,
            purchasePrice: 0,
            salePrice: 0,
            quantity: 1,
            batch: null,
            barcode: "",
            isStock: false,
            originalPurchasePrice: 0,
        };
    }
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

// ==============================
// MAIN COMPONENT
// ==============================

export default function OmborKirim() {
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
    const [partners, setPartners] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState("");
    const [note, setNote] = useState("");

    // Loading states
    const [isLoadingPartners, setIsLoadingPartners] = useState(false);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isLoadingDrawer, setIsLoadingDrawer] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ==============================
    // FETCH PARTNERS
    // ==============================

    const fetchPartners = async () => {
        setIsLoadingPartners(true);
        if (!mainWarehouseId) return
        try {
            const response = await apiLocations.getLocalLocationsByType("partner", mainWarehouseId);
            setPartners(response.data || []);
        } finally {
            setIsLoadingPartners(false);
        }
    };

    useEffect(() => {
        fetchPartners();
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
    // FETCH PRODUCTS (SEARCH)
    // ==============================

    useEffect(() => {
        if (debouncedSearch.length >= 3) {
            fetchProducts(debouncedSearch);
        } else if (debouncedSearch.length === 0) {
            setProducts([]);
        }
    }, [debouncedSearch]);

    const fetchProducts = async (searchText) => {
        setIsLoadingProducts(true);
        try {
            const response = await apiStock.getStocksForOperationById(
                mainWarehouseId,
                searchText || "",
                "incoming"
            );
            const normalized = (response.data || []).map(normalizeProduct);
            setProducts(normalized);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    // ==============================
    // FETCH ALL PRODUCTS (DRAWER)
    // ==============================

    const handleOpenDrawer = async () => {
        sidebar.onOpen();
        // if (products.length > 0 && !debouncedSearch) {
        //     return
        // }
        setIsLoadingDrawer(true);
        try {
            const response = await apiStock.getStocksForOperationById(
                mainWarehouseId,
                "all", // Empty = all products
                "incoming"
            );
            const normalized = (response.data || []).map(normalizeProduct);
            setProducts(normalized);
        } finally {
            setIsLoadingDrawer(false);
        }
    };

    // ==============================
    // ADD PRODUCT TO TABLE
    // ==============================

    const addProduct = useCallback((product) => {
        const existsInSelected = selectedItems.find((item) =>
            item.id === product.id &&
            (item.batch || null) === (product.batch || null)
        );
        if (existsInSelected) {
            toast({
                title: "Mahsulot allaqachon qo'shilgan",
                status: "warning",
                duration: 2000,
                isClosable: true,
                position: "top",
            });
            return;
        }

        const newItem = {
            ...product,
            // Set isNewBatch: true for products, false for stocks
            isNewBatch: !product.isStock,
            // Disable checkbox for products
            canToggleBatch: product.isStock,
            quantity:1
        };

        setSelectedItems((prev) => [...prev, newItem]);

        // Close drawer if open
        if (sidebar.isOpen) {
            sidebar.onClose();
        }

        // Clear search
        setSearch("");
        setProducts([]);
    }, [selectedItems, sidebar, toast]);

    // ==============================
    // UPDATE QUANTITY
    // ==============================

    const updateQuantity = (id, value) => {
        // const qty = parseFloat(value) || 0;
        const qty = +value < 0 ? "" : value
        setSelectedItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, quantity: qty } : item
            )
        );
    };

    // ==============================
    // UPDATE PURCHASE PRICE
    // ==============================

    const updatePurchasePrice = (id, value) => {
        const price = parseFloat(value) || 0;

        setSelectedItems((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    // Auto-detect batch change for stocks
                    if (item.isStock && price !== item.originalPurchasePrice) {
                        return {
                            ...item,
                            purchasePrice: price,
                            isNewBatch: true,
                            canToggleBatch: false, // Lock checkbox
                        };
                    } else if (item.isStock && price === item.originalPurchasePrice) {
                        return {
                            ...item,
                            purchasePrice: price,
                            canToggleBatch: true, // Unlock checkbox
                        };
                    }
                    return { ...item, purchasePrice: price };
                }
                return item;
            })
        );
    };

    // ==============================
    // UPDATE SALE PRICE
    // ==============================

    const updateSalePrice = (id, value) => {
        const price = parseFloat(value) || 0;
        setSelectedItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, salePrice: price } : item
            )
        );
    };

    // ==============================
    // TOGGLE BATCH
    // ==============================

    const toggleBatch = (id) => {
        setSelectedItems((prev) =>
            prev.map((item) =>
                item.id === id && item.canToggleBatch
                    ? { ...item, isNewBatch: !item.isNewBatch }
                    : item
            )
        );
    };

    // ==============================
    // REMOVE ITEM
    // ==============================

    const removeItem = (id) => {
        setSelectedItems((prev) => prev.filter((item) => item.id !== id));
    };

    // ==============================
    // CALCULATIONS
    // ==============================

    const totalAmount = useMemo(() => {
        return selectedItems.reduce(
            (sum, item) => sum + item.purchasePrice * item.quantity,
            0
        );
    }, [selectedItems]);

    const totalItems = selectedItems.length;

    const averagePrice = useMemo(() => {
        if (totalItems === 0) return 0;
        return totalAmount / totalItems;
    }, [totalAmount, totalItems]);

    // ==============================
    // VALIDATION
    // ==============================

    const validateForm = () => {
        if (!selectedPartner) {
            toast({
                title: "Xatolik",
                description: "Jo'natuvchini tanlang",
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
            if (item.purchasePrice <= 0) {
                toast({
                    title: "Xatolik",
                    description: `"${item.name}" uchun narxni kiriting`,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                    position: "top",
                });
                return false;
            }

            if (item.quantity <= 0) {
                toast({
                    title: "Xatolik",
                    description: `"${item.name}" uchun miqdor kamida 1 bo'lishi kerak`,
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
                type: "incoming",
                senderId: selectedPartner,
                receiverId: mainWarehouseId,
                createdBy: userId,
                status: "received",
                note: note || "",
                items: selectedItems.map((item) => ({
                    productId: item.id,
                    quantity: +item.quantity,
                    salePrice: item.salePrice || 0,
                    purchasePrice: item.purchasePrice,
                    discount: 0,
                    isNewBatch: item.isNewBatch,
                    ...(!item.isNewBatch && { batch: item.batch })
                })),
            };

            await apiInvoices.Add(payload);

            // Success - reset form
            setSelectedItems([]);
            setSelectedPartner("");
            setNote("");
            modal.onClose();

            toast({
                title: "Muvaffaqiyatli",
                description: "Kirim hujjati yaratildi",
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
            if (e.key === "Enter" && products.length > 0 && !sidebar.isOpen && !modal.isOpen) {
                addProduct(products[0]);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [products, modal, sidebar, addProduct]);

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
                    Omborga kirim
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

            {/* META INFO - PARTNER & WAREHOUSE */}
            <Grid
                templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                gap={4}
                mb={6}
            >
                <GridItem>
                    <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="medium">
                            Jo'natuvchi
                        </FormLabel>
                        {isLoadingPartners ? (
                            <Skeleton height="40px" borderRadius="md" />
                        ) : (
                            <Select
                                placeholder="Tanlang..."
                                value={selectedPartner}
                                onChange={(e) => setSelectedPartner(e.target.value)}
                                bg={inputBg}
                                borderColor={borderColor}
                                _hover={{ borderColor: "blue.400" }}
                                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                            >
                                {partners.map((partner) => (
                                    <option key={partner.id} value={partner.id}>
                                        {partner.name}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </FormControl>
                </GridItem>

                <GridItem>
                    <FormControl>
                        <FormLabel fontSize="sm" fontWeight="medium">
                            Qabul qiluvchi ombor
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

            {/* NOTE (OPTIONAL) */}
            <FormControl mb={6}>
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
            {isLoadingProducts && (
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

            {!isLoadingProducts && products.length > 0 && (
                <Card mb={6} bg={cardBg} borderColor={borderColor}>
                    <CardBody p={0}>
                        {products.slice(0, 10).map((product, index) => (
                            <Flex
                                key={product.id}
                                p={3}
                                justify="space-between"
                                align="center"
                                borderBottom={index < 9 ? "1px solid" : "none"}
                                borderColor={borderColor}
                                cursor="pointer"
                                _hover={{ bg: hoverBg }}
                                onClick={() => addProduct(product)}
                                transition="background 0.2s"
                            >
                                <VStack align="start" spacing={0}>
                                    <Text fontWeight="medium">{product.name}</Text>
                                    <HStack spacing={2} fontSize="sm" color="gray.500">
                                        <Text>{product.unit}</Text>
                                        {product.isStock && (
                                            <Badge colorScheme="green" fontSize="xs">
                                                Omborda bor
                                            </Badge>
                                        )}
                                    </HStack>
                                </VStack>

                                {product.isStock && (
                                    <VStack align="end" spacing={0}>
                                        <Text fontSize="sm" fontWeight="medium">
                                            {formatNumber(product.purchasePrice)} so'm
                                        </Text>
                                        <Text fontSize="xs" color="gray.500">
                                            Oldingi narx
                                        </Text>
                                    </VStack>
                                )}
                            </Flex>
                        ))}

                        {products.length > 10 && (
                            <Flex p={3} justify="center" borderTop="1px solid" borderColor={borderColor}>
                                <Text fontSize="sm" color="gray.500">
                                    va yana {products.length - 10} ta mahsulot
                                </Text>
                            </Flex>
                        )}
                    </CardBody>
                </Card>
            )}

            {!isLoadingProducts && search.length >= 3 && products.length === 0 && (
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
                        templateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }}
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

                        {/* <Card bg={cardBg} borderColor={borderColor}>
                            <CardBody>
                                <Text fontSize="sm" color="gray.500" mb={1}>
                                    O'rtacha narx
                                </Text>
                                <Text fontSize="2xl" fontWeight="bold">
                                    {formatNumber(Math.round(averagePrice))} so'm
                                </Text>
                            </CardBody>
                        </Card> */}
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
                                    <Th>Partiya</Th>
                                    <Th>Nomlanishi</Th>
                                    <Th>Birlik</Th>
                                    <Th>Narx (so'm)</Th>
                                    <Th>Sotuv narxi (so'm)</Th>
                                    <Th>Miqdor</Th>
                                    <Th>Jami (so'm)</Th>
                                    <Th></Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {selectedItems.map((item) => {
                                    const total = item.purchasePrice * item.quantity;
                                    const isPriceChanged = item.isStock &&
                                        item.purchasePrice !== item.originalPurchasePrice;

                                    return (
                                        <Tr key={item.id}>
                                            {/* BATCH CHECKBOX */}
                                            <Td>
                                                <Tooltip
                                                    label={
                                                        item.isNewBatch
                                                            ? "Yangi partiya"
                                                            : item.batch || "Mavjud partiya"
                                                    }
                                                >
                                                    <Checkbox
                                                        isChecked={item.isNewBatch}
                                                        onChange={() => toggleBatch(item.id)}
                                                        isDisabled={!item.canToggleBatch}
                                                        colorScheme="blue"
                                                    />
                                                </Tooltip>
                                                {item.isNewBatch && (
                                                    <Badge colorScheme="blue" ml={2} fontSize="xs">
                                                        Yangi
                                                    </Badge>
                                                )}
                                                {!item.isNewBatch && item.batch && (
                                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                                        {item.batch}
                                                    </Text>
                                                )}
                                            </Td>

                                            {/* NAME */}
                                            <Td>
                                                <Text fontWeight="medium">{item.name}</Text>
                                                {!item.isStock && (
                                                    <Badge colorScheme="orange" fontSize="xs" mt={1}>
                                                        Yangi mahsulot
                                                    </Badge>
                                                )}
                                            </Td>

                                            {/* UNIT */}
                                            <Td>
                                                <Text color="gray.600" fontSize="sm">
                                                    {item.unit}
                                                </Text>
                                            </Td>

                                            {/* PURCHASE PRICE */}
                                            <Td>
                                                <VStack align="start" spacing={1}>
                                                    <Input
                                                        type="number"
                                                        value={item.purchasePrice || ""}
                                                        onChange={(e) =>
                                                            updatePurchasePrice(item.id, e.target.value)
                                                        }
                                                        placeholder="0"
                                                        size="sm"
                                                        maxW="120px"
                                                        bg={inputBg}
                                                        borderColor={isPriceChanged ? "blue.400" : borderColor}
                                                        _focus={{
                                                            borderColor: "blue.500",
                                                            boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                                                        }}
                                                    />
                                                    {item.isStock && item.originalPurchasePrice > 0 && (
                                                        <Text fontSize="xs" color="gray.500">
                                                            Oldingi: {formatNumber(item.originalPurchasePrice)}
                                                        </Text>
                                                    )}
                                                </VStack>
                                            </Td>

                                            {/* SALE PRICE */}
                                            <Td>
                                                <VStack align="start" spacing={1}>
                                                    <Input
                                                        type="number"
                                                        value={item.salePrice || ""}
                                                        onChange={(e) =>
                                                            updateSalePrice(item.id, e.target.value)
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
                                                    {item.isStock && item.salePrice > 0 && (
                                                        <Text fontSize="xs" color="gray.500">
                                                            Oldingi: {formatNumber(item.salePrice)}
                                                        </Text>
                                                    )}
                                                </VStack>
                                            </Td>

                                            {/* QUANTITY */}
                                            <Td>
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        updateQuantity(item.id, e.target.value)
                                                    }
                                                    placeholder="1"
                                                    size="sm"
                                                    maxW="90px"
                                                    bg={inputBg}
                                                    borderColor={borderColor}
                                                    _focus={{
                                                        borderColor: "blue.500",
                                                        boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                                                    }}
                                                />
                                            </Td>

                                            {/* TOTAL */}
                                            <Td>
                                                <Text fontWeight="bold" color="blue.600">
                                                    {formatNumber(total)}
                                                </Text>
                                            </Td>

                                            {/* DELETE */}
                                            <Td>
                                                <Tooltip label="O'chirish">
                                                    <IconButton
                                                        icon={<DeleteIcon />}
                                                        size="sm"
                                                        colorScheme="red"
                                                        variant="ghost"
                                                        onClick={() => removeItem(item.id)}
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
                            const total = item.purchasePrice * item.quantity;
                            const isPriceChanged = item.isStock &&
                                item.purchasePrice !== item.originalPurchasePrice;

                            return (
                                <Card key={item.id} bg={cardBg} borderColor={borderColor}>
                                    <CardBody>
                                        <Flex justify="space-between" align="start" mb={3}>
                                            <VStack align="start" spacing={1} flex={1}>
                                                <Text fontWeight="bold" fontSize="lg">
                                                    {item.name}
                                                </Text>
                                                <HStack spacing={2}>
                                                    <Badge colorScheme="gray">{item.unit}</Badge>
                                                    {!item.isStock && (
                                                        <Badge colorScheme="orange">Yangi</Badge>
                                                    )}
                                                </HStack>
                                            </VStack>

                                            <IconButton
                                                icon={<DeleteIcon />}
                                                size="sm"
                                                colorScheme="red"
                                                variant="ghost"
                                                onClick={() => removeItem(item.id)}
                                                aria-label="O'chirish"
                                            />
                                        </Flex>

                                        <Divider mb={3} />

                                        {/* BATCH */}
                                        <FormControl mb={3}>
                                            <FormLabel fontSize="sm">Partiya</FormLabel>
                                            <HStack>
                                                <Checkbox
                                                    isChecked={item.isNewBatch}
                                                    onChange={() => toggleBatch(item.id)}
                                                    isDisabled={!item.canToggleBatch}
                                                    colorScheme="blue"
                                                >
                                                    {item.isNewBatch ? "Yangi partiya" : item.batch || "Mavjud"}
                                                </Checkbox>
                                            </HStack>
                                        </FormControl>

                                        {/* PURCHASE PRICE */}
                                        <FormControl mb={3}>
                                            <FormLabel fontSize="sm">Narx (so'm)</FormLabel>
                                            <Input
                                                type="number"
                                                value={item.purchasePrice || ""}
                                                onChange={(e) =>
                                                    updatePurchasePrice(item.id, e.target.value)
                                                }
                                                placeholder="0"
                                                bg={inputBg}
                                                borderColor={isPriceChanged ? "blue.400" : borderColor}
                                            />
                                            {item.isStock && item.originalPurchasePrice > 0 && (
                                                <Text fontSize="xs" color="gray.500" mt={1}>
                                                    Oldingi: {formatNumber(item.originalPurchasePrice)} so'm
                                                </Text>
                                            )}
                                        </FormControl>

                                        {/* SALE PRICE */}
                                        <FormControl mb={3}>
                                            <FormLabel fontSize="sm">Sotuv narxi (so'm)</FormLabel>
                                            <Input
                                                type="number"
                                                value={item.salePrice || ""}
                                                onChange={(e) =>
                                                    updateSalePrice(item.id, e.target.value)
                                                }
                                                placeholder="0"
                                                bg={inputBg}
                                                borderColor={borderColor}
                                            />
                                        </FormControl>

                                        {/* QUANTITY */}
                                        <FormControl mb={3}>
                                            <FormLabel fontSize="sm">Miqdor</FormLabel>
                                            <Input
                                                type="number"
                                                value={item.quantity || ""}
                                                onChange={(e) =>
                                                    updateQuantity(item.id, e.target.value)
                                                }
                                                placeholder="1"
                                                bg={inputBg}
                                                borderColor={borderColor}
                                            />
                                        </FormControl>

                                        {/* TOTAL */}
                                        <Divider mb={3} />
                                        <Flex justify="space-between" align="center">
                                            <Text fontSize="sm" color="gray.500">
                                                Jami:
                                            </Text>
                                            <Text fontSize="xl" fontWeight="bold" color="blue.600">
                                                {formatNumber(total)} so'm
                                            </Text>
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

            {/* DRAWER - ALL PRODUCTS */}
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
                        ) : products.length === 0 ? (
                            <Center py={10}>
                                <VStack spacing={3}>
                                    <WarningIcon boxSize={10} color="gray.400" />
                                    <Text >Mahsulot topilmadi</Text>
                                </VStack>
                            </Center>
                        ) : (
                            <>
                                <Box p={3} borderBottomWidth="1px" bg={hoverBg}>
                                    <Text fontSize="sm" fontWeight="medium">
                                        Jami: {products.length} ta mahsulot
                                    </Text>
                                </Box>

                                {products.map((product, index) => (
                                    <Flex
                                        key={product.id}
                                        p={4}
                                        borderBottom={index < products.length - 1 ? "1px solid" : "none"}
                                        borderColor={"border"}
                                        cursor="pointer"
                                        bg={"surface"}
                                        _hover={{ bg: "bg" }}
                                        onClick={() => addProduct(product)}
                                        transition="background 0.2s"
                                    >
                                        <VStack align="start" spacing={1} flex={1}>
                                            <Text fontWeight="medium">{product.name}</Text>
                                            <HStack spacing={2}>
                                                <Badge colorScheme="gray" fontSize="xs">
                                                    {product.unit}
                                                </Badge>
                                                {product.isStock && (
                                                    <Badge colorScheme="green" fontSize="xs">
                                                        Omborda bor
                                                    </Badge>
                                                )}
                                            </HStack>
                                            {product.isStock && (
                                                <Text fontSize="sm" color="gray.500">
                                                    {formatNumber(product.purchasePrice)} so'm
                                                </Text>
                                            )}
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
                                            <Text fontWeight="medium">Omborga kirim</Text>
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
                                            <Text fontWeight="medium">
                                                {partners.find((p) => p.id === selectedPartner)?.name || "-"}
                                            </Text>
                                        </Box>

                                        <Box>
                                            <Text fontSize="sm" color="gray.500" mb={1}>
                                                Qabul qiluvchi
                                            </Text>
                                            <Text fontWeight="medium">{locationName}</Text>
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
                            <Grid templateColumns="repeat(3, 1fr)" gap={4}>
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

                                {/* <Card bg={cardBg} borderColor={borderColor}>
                                    <CardBody textAlign="center">
                                        <Text fontSize="sm" color="gray.500" mb={1}>
                                            O'rtacha
                                        </Text>
                                        <Text fontSize="2xl" fontWeight="bold">
                                            {formatNumber(Math.round(averagePrice))}
                                        </Text>
                                    </CardBody>
                                </Card> */}
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
                                            <Th isNumeric>Miqdor</Th>
                                            <Th>Birlik</Th>
                                            <Th isNumeric>Jami</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {selectedItems.map((item, index) => (
                                            <Tr key={item.id}>
                                                <Td>{index + 1}</Td>
                                                <Td>
                                                    <Text fontWeight="medium">{item.name}</Text>
                                                </Td>
                                                <Td>
                                                    {item.isNewBatch ? (
                                                        <Badge colorScheme="blue">Yangi</Badge>
                                                    ) : (
                                                        <Text fontSize="xs">{item.batch || "-"}</Text>
                                                    )}
                                                </Td>
                                                <Td isNumeric>{formatNumber(item.purchasePrice)}</Td>
                                                <Td isNumeric>{item.quantity}</Td>
                                                <Td>{item.unit}</Td>
                                                <Td isNumeric fontWeight="bold">
                                                    {formatNumber(item.purchasePrice * item.quantity)}
                                                </Td>
                                            </Tr>
                                        ))}
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
          
          .chakra-button {
            display: none !important;
          }
        }
      `}</style>
        </Box>
    );
}