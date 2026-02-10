import { useState, useEffect } from "react";
import {
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerCloseButton,
    SimpleGrid,
    Card,
    CardBody,
    Image,
    Text,
    Box,
    Badge,
    useColorModeValue,
    Input,
    InputGroup,
    InputLeftElement,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Spinner,
    Center,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { apiCategories } from "../../../../utils/Controllers/apiCategories";
import { apiMenuProducts } from "../../../../utils/Controllers/apiMenuProducts";
import { IMAGE_URL } from "../../../../constants/imageUrl";

export default function ProductModal({ isOpen, onClose, orderItems, addItem }) {
    const [categories, setCategories] = useState([]);
    const [categoryProducts, setCategoryProducts] = useState({}); // { categoryId: [products] }
    const [searchResults, setSearchResults] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState({});

    // ─── Dark mode ranglar ───
    const drawerBg = useColorModeValue("white", "gray.800");
    const bgCard = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const textMuted = useColorModeValue("gray.500", "gray.400");
    const textPrimary = useColorModeValue("gray.800", "gray.100");
    const accentColor = useColorModeValue("blue.600", "blue.300");
    const cardHoverBorder = useColorModeValue("blue.200", "blue.500");
    const imgFallbackBg = useColorModeValue("gray.100", "gray.700");
    const inputBg = useColorModeValue("white", "gray.700");

    // ─── Kategoriyalarni yuklash ───
    const GetAllCategory = async () => {
        try {
            setLoading(true);
            const response = await apiCategories.All();
            setCategories(response.data?.categories || response.categories || []);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    // ─── Kategoriya bo'yicha mahsulotlarni yuklash ───
    const GetProductsByCategory = async (categoryId) => {
        if (categoryProducts[categoryId]) {
            return; // Agar allaqachon yuklangan bo'lsa, qayta yuklamaymiz
        }

        try {
            setLoadingCategories(prev => ({ ...prev, [categoryId]: true }));
            const response = await apiMenuProducts.getFilteredProducts(
                categoryId,
                "",
                1,
                100
            );
            const productsData = response.data?.data?.records || response?.data?.records || [];
            setCategoryProducts(prev => ({
                ...prev,
                [categoryId]: productsData
            }));
        } catch (error) {
            setCategoryProducts(prev => ({
                ...prev,
                [categoryId]: []
            }));
        } finally {
            setLoadingCategories(prev => ({ ...prev, [categoryId]: false }));
        }
    };

    // ─── Qidiruv ───
    const SearchProducts = async (searchQuery) => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            setLoading(true);
            const response = await apiMenuProducts.getFilteredProducts(
                "",
                searchQuery,
                1,
                100
            );
            const productsData = response.data?.data?.records || response?.data?.records || [];
            setSearchResults(productsData);
        } catch (error) {
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            GetAllCategory();
            setSearch("");
            setSearchResults([]);
            setCategoryProducts({});
        }
    }, [isOpen]);

    // ─── Qidiruv debounce ───
    useEffect(() => {
        const timer = setTimeout(() => {
            SearchProducts(search);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    // ─── Narxni formatlash ───
    const formatPrice = (price) =>
        Number(price).toLocaleString("uz-UZ") + " so'm";

    // ─── Mahsulot kartasini render qilish ───
    const renderProductCard = (product) => {
        const inCart = orderItems.find((o) => o.productId === product.id);
        return (
            <Card
                key={product.id}
                variant="outline"
                cursor="pointer"
                bg={bgCard}
                borderColor={borderColor}
                onClick={() => addItem(product)}
                _hover={{
                    shadow: "md",
                    borderColor: cardHoverBorder,
                }}
                transition="all 0.15s"
                position="relative"
            >
                <CardBody p={3}>
                    {/* {product.image ? (
                        <Image
                            src={IMAGE_URL + product?.image}
                            alt={product.name}
                            borderRadius="md"
                            h="100px"
                            w="100%"
                            objectFit="cover"
                            mb={2}
                        />
                    ) : (
                        <Box
                            h="100px"
                            bg={imgFallbackBg}
                            borderRadius="md"
                            mb={2}
                        />
                    )} */}
                    <Text
                        fontWeight="medium"
                        fontSize="sm"
                        noOfLines={1}
                        color={textPrimary}
                    >
                        {product.name}
                    </Text>
                    <Text
                        color={accentColor}
                        fontWeight="bold"
                        fontSize="sm"
                    >
                        {formatPrice(product.price)}
                    </Text>
                    {inCart && (
                        <Badge
                            colorScheme="blue"
                            position="absolute"
                            top={2}
                            right={2}
                            borderRadius="full"
                            px={2}
                        >
                            {inCart.count}
                        </Badge>
                    )}
                </CardBody>
            </Card>
        );
    };

    return (
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="full">
            <DrawerOverlay />
            <DrawerContent bg={drawerBg} maxW="50vw" ml="auto">
                <DrawerCloseButton color={textPrimary} />
                <DrawerHeader
                    borderBottomWidth="1px"
                    borderColor={borderColor}
                    color={textPrimary}
                >
                    Mahsulotlar
                </DrawerHeader>
                <DrawerBody py={4}>
                    {/* QIDIRUV */}
                    <Box mb={4} position="sticky" top={0} bg={drawerBg} zIndex={1} pb={2}>
                        <InputGroup>
                            <InputLeftElement pointerEvents="none">
                                <SearchIcon color={textMuted} />
                            </InputLeftElement>
                            <Input
                                placeholder="Mahsulot qidirish..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                bg={inputBg}
                                borderColor={borderColor}
                                color={textPrimary}
                                _placeholder={{ color: textMuted }}
                            />
                        </InputGroup>
                    </Box>

                    {/* QIDIRUV NATIJALARI */}
                    {search && (
                        <Box>
                            {loading && (
                                <Center py={10}>
                                    <Spinner size="xl" color={accentColor} />
                                </Center>
                            )}

                            {!loading && searchResults.length > 0 && (
                                <Box>
                                    <Text fontWeight="bold" fontSize="md" mb={3} color={textPrimary}>
                                        Qidiruv natijalari ({searchResults.length})
                                    </Text>
                                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                                        {searchResults.map((product) => renderProductCard(product))}
                                    </SimpleGrid>
                                </Box>
                            )}

                            {!loading && searchResults.length === 0 && (
                                <Center py={10}>
                                    <Text textAlign="center" color={textMuted}>
                                        Qidiruv bo'yicha mahsulot topilmadi
                                    </Text>
                                </Center>
                            )}
                        </Box>
                    )}

                    {/* KATEGORIYALAR ACCORDIONI */}
                    {!search && (
                        <Box>
                            {loading && (
                                <Center py={10}>
                                    <Spinner size="xl" color={accentColor} />
                                </Center>
                            )}

                            {!loading && (
                                <Accordion allowMultiple>
                                    {categories.map((category) => (
                                        <AccordionItem
                                            key={category.id}
                                            border="1px solid"
                                            borderColor={borderColor}
                                            borderRadius="md"
                                            mb={3}
                                        >
                                            <AccordionButton
                                                onClick={() => GetProductsByCategory(category.id)}
                                                _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}
                                                borderRadius="md"
                                            >
                                                <Box flex="1" textAlign="left">
                                                    <Text
                                                        fontWeight="bold"
                                                        fontSize="md"
                                                        color={textPrimary}
                                                    >
                                                        {category.name}
                                                    </Text>
                                                    {categoryProducts[category.id] && (
                                                        <Text fontSize="xs" color={textMuted}>
                                                            {categoryProducts[category.id].length} ta mahsulot
                                                        </Text>
                                                    )}
                                                </Box>
                                                <AccordionIcon color={textPrimary} />
                                            </AccordionButton>

                                            <AccordionPanel pb={4} pt={3}>
                                                {loadingCategories[category.id] && (
                                                    <Center py={5}>
                                                        <Spinner color={accentColor} />
                                                    </Center>
                                                )}

                                                {!loadingCategories[category.id] && categoryProducts[category.id] && (
                                                    <SimpleGrid
                                                        columns={{ base: 1, sm: 2, md: 3 }}
                                                        spacing={3}
                                                    >
                                                        {categoryProducts[category.id].map((product) =>
                                                            renderProductCard(product)
                                                        )}
                                                    </SimpleGrid>
                                                )}

                                                {!loadingCategories[category.id] &&
                                                    categoryProducts[category.id]?.length === 0 && (
                                                        <Center py={5}>
                                                            <Text color={textMuted}>
                                                                Bu kategoriyada mahsulot yo'q
                                                            </Text>
                                                        </Center>
                                                    )}
                                            </AccordionPanel>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            )}

                            {!loading && categories.length === 0 && (
                                <Center py={10}>
                                    <Text textAlign="center" color={textMuted}>
                                        Kategoriyalar topilmadi
                                    </Text>
                                </Center>
                            )}
                        </Box>
                    )}
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    );
}