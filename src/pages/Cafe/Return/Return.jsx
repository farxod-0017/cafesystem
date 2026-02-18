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
    Tooltip,
    Modal,
    ModalBody,
    ModalOverlay,
    Center,
    ModalContent,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, MinusIcon } from "@chakra-ui/icons";
import { apiPayment } from "../../../utils/Controllers/apiPayment";
import Cookies from "js-cookie";
import ProductModal from "./__components/ProductModal";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { NavLink } from "react-router-dom";
import { apiPaymentItems } from "../../../utils/Controllers/apiPaymentItems";
import TableSkeleton from "../../../components/ui/TableSkeleton";

export default function OrderCreate() {
    const navigate = useNavigate()
    const [orderItems, setOrderItems] = useState([]);
    const [editingOrder, setEditingOrder] = useState({})
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false)
    const { id } = useParams();
    const sidebar = useDisclosure();
    const blockModal = useDisclosure();

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
            };
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

    // FETCh editing ORDER
    const fetchOrder = async (id) => {
        setFetching(true)
        try {
            const res = await apiPayment.GetById(id);
            setEditingOrder(res.data);
        } finally {
            setFetching(false)
        }
    };
    useEffect(() => {
        if (id) {
            fetchOrder(id)
        }
    }, [id])
    // ─── Qaytarish yaratish ───
    const createAdditionalItems = async () => {
        if (orderItems.length === 0) {
            toast({
                title: "Kamida bitta mahsulot qo'shing",
                status: "warning",
                duration: 2000,
            });
            return;
        }

        const returnData = {
            paymentId: id,
            // createdBy: Cookies.get("user_id"),
            // reason: reason || "Customer changed mind",
            items: orderItems.map((item) => ({
                productId: item.productId,
                count: item.count,
                price: item.price,
            })),
        };

        try {
            setLoading(true);
            const response = await apiPaymentItems.Create(returnData);
            fetchOrder(id)

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
                <Flex gap={2}>
                    <Tooltip label='Ortga'>
                        <IconButton
                            onClick={() => navigate(-1)}
                            icon={<ArrowLeft />}
                        />
                    </Tooltip>
                    <Heading size="lg" color={textPrimary}>
                        Buyurtmani tahrirlash
                    </Heading>
                </Flex>

                <Button
                    colorScheme="blue"
                    onClick={sidebar.onOpen}
                    leftIcon={<AddIcon />}
                >
                    Mahsulotlar
                </Button>
            </Flex>
            {/* ESKI BUYURMALAR */}
            <Heading size={'md'} mb={3}>Buyurmada bor</Heading>
            {fetching ?
                <Box>
                    <Table size="sm" variant="simple">
                        <Thead bg={bgTableHead}>
                            <Tr>
                                <Th color={textMuted}>#</Th>
                                <Th color={textMuted}>Mahsulot</Th>
                                <Th color={textMuted} isNumeric>Narx</Th>
                                <Th color={textMuted} isNumeric>Soni</Th>
                                <Th color={textMuted} isNumeric>Jami</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            <TableSkeleton rows={4} columns={5} />
                        </Tbody>
                    </Table>

                </Box> :
                <Box>
                    <Table size="sm" variant="simple">
                        <Thead bg={bgTableHead}>
                            <Tr>
                                <Th color={textMuted}>#</Th>
                                <Th color={textMuted}>Mahsulot</Th>
                                <Th color={textMuted} isNumeric>Narx</Th>
                                <Th color={textMuted} isNumeric>Soni</Th>
                                <Th color={textMuted} isNumeric>Jami</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {editingOrder.items?.map((item, idx) => (
                                <Tr key={item.id}>
                                    <Td color={textPrimary} fontSize="sm">{idx + 1}</Td>
                                    <Td color={textPrimary} fontSize="xs" fontFamily="mono">
                                        {item?.product?.name}
                                    </Td>
                                    <Td isNumeric color={textPrimary} fontSize="sm">
                                        {formatPrice(item.price)}
                                    </Td>
                                    <Td isNumeric color={textPrimary} fontSize="sm">
                                        {item.count}
                                    </Td>
                                    <Td isNumeric fontWeight="semibold" color={accentColor} fontSize="sm">
                                        {formatPrice(item.price * item.count)}
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            }


            {/* BUYURTMA JADVALI */}
            <Heading size={'md'} mb={3} mt={8}>Buyurtmaga qo'shilmoqda</Heading>
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
                            Qo'shilayotgan jami summa
                        </Text>
                        <Heading size="md" color={accentColor}>
                            {formatPrice(totalSum)}
                        </Heading>
                    </VStack>

                    <HStack spacing={3} flexWrap="wrap">
                        <Badge
                            colorScheme="blue"
                            fontSize="sm"
                            px={3}
                            py={1}
                            borderRadius="md"
                        >
                            {orderItems.length} ta mahsulot qo'shilmoqda
                        </Badge>
                        <Button
                            colorScheme="blue"
                            size="lg"
                            onClick={createAdditionalItems}
                            isLoading={loading}
                            loadingText="Qaytarilmoqda..."
                        >
                            Qo'shish
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

            {/* BLOCK MODAL */}
            <Modal isOpen={blockModal.isOpen} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalBody p={8}>
                        <VStack>
                            <Heading size={'md'} color={'danger'} textAlign={'center'}>
                                Ushbu buyurtmani tahrirlab bo'lmaydi(sotuv buyurtma va to'lov qilinmagan bo'lishi shart)
                            </Heading>
                            <NavLink to={'/cafe/orders'}>
                                <Button mt={4} >
                                    Buyurtmalarga qaytish
                                </Button>
                            </NavLink>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}