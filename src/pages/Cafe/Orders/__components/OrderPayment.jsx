import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    VStack,
    Text,
    useColorModeValue,
    useToast,
    HStack,
    Divider,
    Box,
    Grid,
    Flex,
    Select,
    IconButton,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { apiPayMethods } from "../../../../utils/Controllers/apiPayMethods";
import { apiCashs } from "../../../../utils/Controllers/apiCashs";
import { CreditCard, Wallet2 } from "lucide-react";

export default function OrderPayment({
    isOpen,
    onClose,
    paymentId,
    orderData,
    onSumUpdated,
    cafeWarehouseId
}) {
    const [sum, setSum] = useState("");
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const bgModal = useColorModeValue("white", "gray.800");
    const textPrimary = useColorModeValue("gray.800", "gray.100");
    const textMuted = useColorModeValue("gray.600", "gray.400");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const accentColor = useColorModeValue("blue.600", "blue.300");
    const buttonBg = useColorModeValue("gray.100", "gray.700");
    const buttonHoverBg = useColorModeValue("gray.200", "gray.600");
    const buttonActiveBg = useColorModeValue("gray.300", "gray.500");
    const inputBg = useColorModeValue("white", "gray.700");

    const [cashs, setCashs] = useState([]);
    const [payMethods, setPayMethods] = useState([]);
    const [selectedCash, setSelectedCash] = useState("");
    const [selectedPayMethod, setSelectedPayMethod] = useState("");

    // ─── API calls ───
    const GetCash = async () => {
        try {
            const response = await apiCashs.getAll();
            const allCashs = response.data || response;

            // Фильтрация по locationId
            const filteredCashs = allCashs.filter(
                (cash) => cash.locationId === cafeWarehouseId
            );

            setCashs(filteredCashs);
            setSelectedCash(filteredCashs[0]?.id || ""); // Автоматически выбирать первую кассу
        } catch (error) {
        }
    };

    const GetPaymentMethod = async () => {
        try {
            const response = await apiPayMethods.getAll();
            const allPayMethods = response.data?.payMethods || response.payMethods || [];

            // Фильтрация по locationId
            const filteredPayMethods = allPayMethods.filter(
                (method) => method.locationId === cafeWarehouseId
            );
            setPayMethods(filteredPayMethods);
            const findNaqt = filteredPayMethods?.find((e) => e?.name?.toLowerCase().includes("naq"));
            if (findNaqt) {
                setSelectedPayMethod(findNaqt?.id)
            } else {
                setSelectedPayMethod(filteredPayMethods?.[1]?.id || ""); // Автоматически выбирать первый метод оплаты
            }
        } finally { }
    };

    useEffect(() => {
        // Запускать только если cafeWarehouseId определен
        if (cafeWarehouseId) {
            GetCash();
            GetPaymentMethod();
        }
    }, [cafeWarehouseId]); // Добавить cafeWarehouseId в зависимости

    // Автоматически заполняем сумму заказа
    useEffect(() => {
        if (orderData?.totalSum) {
            setSum(orderData.totalSum.toString());
        }
    }, [orderData]);

    const formatPrice = (price) =>
        Number(price).toLocaleString("uz-UZ") + " so'm";

    // Функция для добавления цифры
    const handleNumberClick = (number) => {
        if (sum === "0") {
            setSum(number.toString());
        } else {
            setSum(prev => prev + number.toString());
        }
    };

    // Функция для добавления точки (для десятичных)
    const handleDotClick = () => {
        if (!sum.includes('.')) {
            setSum(prev => prev + '.');
        }
    };

    // Функция удаления последнего символа
    const handleDeleteClick = () => {
        if (sum.length > 0) {
            setSum(prev => prev.slice(0, -1));
        }
    };

    // Функция очистки
    const handleClearClick = () => {
        setSum("");
    };

    // Функция установки полной суммы
    const handleFullAmountClick = () => {
        if (orderData?.totalSum) {
            setSum(orderData.totalSum.toString());
        }
    };

    const handleSubmit = async () => {
        if (!sum || parseFloat(sum) <= 0) {
            toast({
                title: "Summani kiriting",
                status: "warning",
                duration: 2000,
                isClosable: true,
            });
            return;
        }
        if (parseFloat(sum) < orderData?.totalSum) {
            toast({
                title: "Summa yetarli emas",
                status: "warning",
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        setLoading(true);
        try {
            const data = {
                receivedSum: parseFloat(sum),
                cashId: selectedCash,
                payMethodId: selectedPayMethod,
            }
            await onSumUpdated(paymentId, data);

            // toast({
            //     title: "Muvaffaqiyatli!",
            //     description: "To'lov qabul qilindi",
            //     status: "success",
            //     duration: 2000,
            //     isClosable: true,
            // });

            setSum("");
            onClose();
        } catch (error) {
            toast({
                title: "Xatolik yuz berdi",
                description: error?.response?.data?.message || "Summani yangilashda xatolik",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSum("");
        onClose();
    };

    // Qaytim hisoblash
    const totalSum = orderData?.totalSum || 0;
    const receivedSum = parseFloat(sum) || 0;
    const changeSum = receivedSum - totalSum;

    // Клавиши для клавиатуры
    const keyboardButtons = [
        { label: "1", onClick: () => handleNumberClick(1) },
        { label: "2", onClick: () => handleNumberClick(2) },
        { label: "3", onClick: () => handleNumberClick(3) },
        { label: "4", onClick: () => handleNumberClick(4) },
        { label: "5", onClick: () => handleNumberClick(5) },
        { label: "6", onClick: () => handleNumberClick(6) },
        { label: "7", onClick: () => handleNumberClick(7) },
        { label: "8", onClick: () => handleNumberClick(8) },
        { label: "9", onClick: () => handleNumberClick(9) },
        { label: ".", onClick: handleDotClick },
        { label: "0", onClick: () => handleNumberClick(0) },
        { label: "⌫", onClick: handleDeleteClick },
    ];

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="sm" isCentered>
            <ModalOverlay backdropFilter="blur(2px)" />
            <ModalContent bg={bgModal} maxH="85vh" overflowY="auto">
                <ModalHeader pb={2} pt={4}>
                    <Text fontSize="lg" color={textPrimary}>
                        To'lov qilish
                    </Text>
                    {orderData?.payNumber && (
                        <Text fontSize="xs" fontWeight="normal" color={textMuted} mt={0.5}>
                            Buyurtma: {orderData.payNumber}
                        </Text>
                    )}
                </ModalHeader>
                <ModalCloseButton size="sm" />

                <ModalBody py={2} px={4}>
                    <VStack spacing={3} align="stretch">
                        <Box>
                            <HStack alignItems={"center"} mb={"8px"}
                            >
                                <Select
                                    placeholder="Kassani tanlang"
                                    maxW="300px"
                                    bg={inputBg}
                                    borderColor={borderColor}
                                    color={textPrimary}
                                    value={selectedCash}
                                    onChange={(e) => setSelectedCash(e.target.value)}
                                >
                                    {cashs.map((cash) => (
                                        <option key={cash.id} value={cash.id}>
                                            {cash.name}
                                        </option>
                                    ))}
                                </Select>
                                <IconButton icon={<Wallet2 />} />
                            </HStack>

                            <HStack>

                                <Select
                                    placeholder="To'lov usuli"
                                    maxW="300px"
                                    bg={inputBg}
                                    borderColor={borderColor}
                                    color={textPrimary}
                                    value={selectedPayMethod}
                                    onChange={(e) => setSelectedPayMethod(e.target.value)}
                                >
                                    {payMethods.map((method) => (
                                        <option key={method.id} value={method.id}>
                                            {method.name}
                                        </option>
                                    ))}
                                </Select>
                                <IconButton icon={<CreditCard />} />
                            </HStack>

                        </Box>
                        {/* Buyurtma ma'lumotlari - компактная версия */}
                        <Box
                            p={2}
                            bg={useColorModeValue("gray.50", "gray.700")}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor={borderColor}
                        >
                            <HStack justify="space-between" spacing={2}>
                                <VStack align="flex-start" spacing={0} flex={1}>
                                    <Text fontSize="xs" color={textMuted}>
                                        Jami summa:
                                    </Text>
                                    <Text fontSize="sm" fontWeight="bold" color={accentColor}>
                                        {formatPrice(totalSum)}
                                    </Text>
                                </VStack>

                                {orderData?.payMethod?.name && (
                                    <VStack align="flex-end" spacing={0} flex={1}>
                                        <Text fontSize="xs" color={textMuted}>
                                            To'lov usuli:
                                        </Text>
                                        <Text fontSize="sm" color={textPrimary}>
                                            {orderData.payMethod.name}
                                        </Text>
                                    </VStack>
                                )}
                            </HStack>
                        </Box>

                        {/* Отображение введённой суммы */}
                        <Box>
                            <FormLabel fontSize="sm" mb={1} color={textPrimary}>
                                Qabul qilingan summa
                            </FormLabel>
                            <Box
                                p={3}
                                bg={useColorModeValue("gray.50", "gray.700")}
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor={borderColor}
                                minH="60px"
                                display="flex"
                                alignItems="center"
                                justifyContent="flex-end"
                            >
                                <Text
                                    fontSize="xl"
                                    fontWeight="bold"
                                    color={sum ? accentColor : textMuted}
                                    fontFamily="monospace"
                                    textAlign="right"
                                    noOfLines={1}
                                >
                                    {sum ? formatPrice(sum) : "0 so'm"}
                                </Text>
                            </Box>

                            {/* Кнопки быстрого доступа */}
                            <Flex gap={1} mt={2} justifyContent="space-between">
                                <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={handleFullAmountClick}
                                    isDisabled={!orderData?.totalSum}
                                    flex={1}
                                    mr={1}
                                >
                                    To'liq summa
                                </Button>
                                <Button
                                    size="xs"
                                    variant="outline"
                                    colorScheme="red"
                                    onClick={handleClearClick}
                                    flex={1}
                                    ml={1}
                                >
                                    Tozalash
                                </Button>
                            </Flex>
                        </Box>

                        {/* Виртуальная клавиатура - компактная */}
                        <Box>
                            <Text fontSize="xs" color={textMuted} mb={1}>
                                Klaviatura:
                            </Text>
                            <Grid
                                templateColumns="repeat(3, 1fr)"
                                gap={1.5}
                                autoRows="minmax(40px, auto)"
                            >
                                {keyboardButtons.map((btn, index) => (
                                    <Button
                                        key={index}
                                        height="40px"
                                        fontSize={btn.label === "⌫" ? "md" : "lg"}
                                        fontWeight="bold"
                                        bg={buttonBg}
                                        _hover={{ bg: buttonHoverBg }}
                                        _active={{ bg: buttonActiveBg }}
                                        onClick={btn.onClick}
                                        isDisabled={loading}
                                        p={1}
                                    >
                                        {btn.label}
                                    </Button>
                                ))}
                            </Grid>
                        </Box>

                        {/* Qaytim - только если есть сумма */}
                        {sum && parseFloat(sum) > 0 && (
                            <Box
                                p={2}
                                mt={1}
                                bg={changeSum >= 0
                                    ? useColorModeValue("green.50", "green.900")
                                    : useColorModeValue("red.50", "red.900")
                                }
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor={changeSum >= 0 ? "green.200" : "red.200"}
                            >
                                <HStack justify="space-between" align="center">
                                    <Text fontSize="sm" fontWeight="medium" color={textPrimary}>
                                        Qaytim:
                                    </Text>
                                    <Text
                                        fontSize="lg"
                                        fontWeight="bold"
                                        color={changeSum >= 0 ? "green.600" : "red.600"}
                                    >
                                        {formatPrice(Math.abs(changeSum))}
                                    </Text>
                                </HStack>
                                {changeSum < 0 && (
                                    <Text fontSize="xs" color="red.600" mt={0.5}>
                                        ⚠️ Summa yetarli emas!
                                    </Text>
                                )}
                            </Box>
                        )}
                    </VStack>
                </ModalBody>

                <ModalFooter borderTopWidth="1px" borderColor={borderColor} pt={3} pb={3}>
                    <Flex width="100%" justify="space-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            isDisabled={loading}
                            flex={1}
                            mr={1}
                        >
                            Bekor qilish
                        </Button>
                        <Button
                            colorScheme="green"
                            onClick={handleSubmit}
                            isLoading={loading}
                            loadingText="To'lanmoqda..."
                            isDisabled={!sum || parseFloat(sum) <= 0}
                            size="sm"
                            flex={1}
                            ml={1}
                        >
                            Tasdiqlash
                        </Button>
                    </Flex>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}