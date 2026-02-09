import { useEffect, useState } from "react";
import {
    Box,
    Flex,
    Heading,
    Button,
    Input,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    IconButton,
    Text,
    Badge,
    useDisclosure,
    HStack,
    VStack,
    useToast,
    NumberInput,
    NumberInputField,
    useColorModeValue,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, MinusIcon } from "@chakra-ui/icons";
import { apiPayment } from "../../../utils/Controllers/apiPayment";
import Cookies from "js-cookie";
import ProductModal from "./__components/ProductModal";
import { useParams } from "react-router";

export default function OrderCreate() {
    const [orderItems, setOrderItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [originalPaymentId, setOriginalPaymentId] = useState("");
    const [reason, setReason] = useState("");
    const {id} = useParams()
    const sidebar = useDisclosure();
    const toast = useToast();

    // ─── Dark mode ranglar ───
    const bgPage = useColorModeValue("gray.50", "gray.900");
    const bgCard = useColorModeValue("white", "gray.800");
    const bgTableHead = useColorModeValue("gray.50", "gray.700");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const textMuted = useColorModeValue("gray.500", "gray.400");
    const textPrimary = useColorModeValue("gray.800", "gray.100");
    const accentColor = useColorModeValue("blue.600", "blue.300");
    const inputBg = useColorModeValue("white", "gray.700");

    // ─── Mahsulotni buyurtmaga qo'shish ───
    const addItem = (product) => {
        setOrderItems((prev) => {
            const exists = prev.find((item) => item.productId === product.id);
            if (exists) {
                return prev.map((item) =>
                    item.productId === product.id
                        ? { ...item, count: item.count + 1 }
                        : item
                );
            }
            return [
                ...prev,
                {
                    productId: product.id,
                    name: product.name,
                    price: parseFloat(product.price),
                    count: 1,
                },
            ];
        });

        toast({
            title: `${product.name} qo'shildi`,
            status: "success",
            duration: 1000,
            isClosable: true,
            position: "top-right",
        });
    };

    // ─── Sonini o'zgartirish ───
    const updateCount = (productId, newCount) => {
        if (newCount < 1) {
            removeItem(productId);
            return;
        }
        setOrderItems((prev) =>
            prev.map((item) =>
                item.productId === productId ? { ...item, count: newCount } : item
            )
        );
    };

    // ─── O'chirish ───
    const removeItem = (productId) => {
        setOrderItems((prev) =>
            prev.filter((item) => item.productId !== productId)
        );
    };

    // ─── Jami summa ───
    const totalSum = orderItems.reduce(
        (sum, item) => sum + item.price * item.count,
        0
    );

    // ─── Qaytarish yaratish ───
    const createReturn = async () => {
        if (orderItems.length === 0) {
            toast({
                title: "Kamida bitta mahsulot qo'shing",
                status: "warning",
                duration: 2000,
            });
            return;
        }

        const returnData = {
            originalPaymentId: id,
            createdBy: Cookies.get("user_id"),
            reason: reason || "Customer changed mind",
            items: orderItems.map((item) => ({
                productId: item.productId,
                count: item.count,
                price: item.price,
            })),
        };

        try {
            setLoading(true);
            const response = await apiPayment.CreateReturn(returnData); // Yangi endpoint kerak bo'ladi

            toast({
                title: "Qaytarish yaratildi!",
                status: "success",
                duration: 3000,
            });

            // Tozalash
            setOrderItems([]);
            setOriginalPaymentId("");
            setReason("");

        } catch (error) {
            toast({
                title: "Xatolik yuz berdi",
                status: "error",
                duration: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    // ─── Narxni formatlash ───
    const formatPrice = (price) =>
        Number(price).toLocaleString("uz-UZ") + " so'm";

    return (
        <Box bg={bgPage} minH="100vh" p={{ base: 4, md: 6 }}>
            {/* HEADER */}
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg" color={textPrimary}>
                    Buyurtmani qaytarish
                </Heading>
                <Button
                    colorScheme="blue"
                    onClick={sidebar.onOpen}
                    leftIcon={<AddIcon />}
                >
                    Mahsulotlar
                </Button>
            </Flex>

            {/* PAYMENT ID VA SABAB */}
            <Box
                bg={bgCard}
                borderRadius="xl"
                border="1px solid"
                borderColor={borderColor}
                p={5}
                mb={6}
            >
                <VStack spacing={4} align="stretch">
                    <Box>
                        <Text mb={2} color={textMuted} fontSize="sm">
                            Sabab (ixtiyoriy)
                        </Text>
                        <Input
                            placeholder="Customer changed mind"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            bg={inputBg}
                            borderColor={borderColor}
                        />
                    </Box>
                </VStack>
            </Box>

            {/* BUYURTMA JADVALI */}
            <Box
                bg={bgCard}
                borderRadius="xl"
                border="1px solid"
                borderColor={borderColor}
                overflow="hidden"
                mb={6}
            >
                <Table variant="simple" size="md">
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
                            <Th></Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {orderItems.length === 0 ? (
                            <Tr>
                                <Td colSpan={6} textAlign="center" py={10} color={textMuted}>
                                    Mahsulot qo'shilmagan. "Mahsulotlar" tugmasini bosing.
                                </Td>
                            </Tr>
                        ) : (
                            orderItems.map((item, index) => (
                                <Tr key={item.productId}>
                                    <Td color={textPrimary}>{index + 1}</Td>
                                    <Td fontWeight="medium" color={textPrimary}>
                                        {item.name}
                                    </Td>
                                    <Td isNumeric color={textPrimary}>
                                        {formatPrice(item.price)}
                                    </Td>
                                    <Td isNumeric>
                                        <HStack justify="flex-end" spacing={1}>
                                            <IconButton
                                                size="xs"
                                                icon={<MinusIcon />}
                                                onClick={() =>
                                                    updateCount(item.productId, item.count - 1)
                                                }
                                                variant="outline"
                                                borderColor={borderColor}
                                                color={textPrimary}
                                                aria-label="Kamaytirish"
                                            />
                                            <NumberInput
                                                size="sm"
                                                maxW="70px"
                                                min={1}
                                                value={item.count}
                                                onChange={(_, val) =>
                                                    updateCount(item.productId, val)
                                                }
                                            >
                                                <NumberInputField
                                                    textAlign="center"
                                                    px={1}
                                                    bg={inputBg}
                                                    color={textPrimary}
                                                    borderColor={borderColor}
                                                />
                                            </NumberInput>
                                            <IconButton
                                                size="xs"
                                                icon={<AddIcon />}
                                                onClick={() =>
                                                    updateCount(item.productId, item.count + 1)
                                                }
                                                variant="outline"
                                                borderColor={borderColor}
                                                color={textPrimary}
                                                aria-label="Oshirish"
                                            />
                                        </HStack>
                                    </Td>
                                    <Td isNumeric fontWeight="semibold" color={accentColor}>
                                        {formatPrice(item.price * item.count)}
                                    </Td>
                                    <Td>
                                        <IconButton
                                            size="sm"
                                            icon={<DeleteIcon />}
                                            colorScheme="red"
                                            variant="ghost"
                                            onClick={() => removeItem(item.productId)}
                                            aria-label="O'chirish"
                                        />
                                    </Td>
                                </Tr>
                            ))
                        )}
                    </Tbody>
                </Table>
            </Box>

            {/* JAMI VA TASDIQLASH */}
            {orderItems.length > 0 && (
                <Flex
                    justify="space-between"
                    align="center"
                    bg={bgCard}
                    p={5}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={borderColor}
                    flexWrap="wrap"
                    gap={3}
                >
                    <VStack align="flex-start" spacing={0}>
                        <Text color={textMuted} fontSize="sm">
                            Qaytarish summasi
                        </Text>
                        <Heading size="md" color={accentColor}>
                            {formatPrice(totalSum)}
                        </Heading>
                    </VStack>

                    <HStack spacing={3} flexWrap="wrap">
                        <Badge
                            colorScheme="red"
                            fontSize="sm"
                            px={3}
                            py={1}
                            borderRadius="md"
                        >
                            {orderItems.length} ta mahsulot qaytarilmoqda
                        </Badge>
                        <Button
                            colorScheme="red"
                            size="lg"
                            onClick={createReturn}
                            isLoading={loading}
                            loadingText="Qaytarilmoqda..."
                        >
                            Qaytarishni tasdiqlash
                        </Button>
                    </HStack>
                </Flex>
            )}

            {/* MAHSULOTLAR MODAL */}
            <ProductModal
                isOpen={sidebar.isOpen}
                onClose={sidebar.onClose}
                orderItems={orderItems}
                addItem={addItem}
            />
        </Box>
    );
}