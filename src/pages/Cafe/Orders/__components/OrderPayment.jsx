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
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    VStack,
    Text,
    useColorModeValue,
    useToast,
    HStack,
    Divider,
    Box,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";

export default function OrderPayment({
    isOpen,
    onClose,
    paymentId,
    orderData,
    onSumUpdated
}) {
    const [sum, setSum] = useState("");
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const bgModal = useColorModeValue("white", "gray.800");
    const textPrimary = useColorModeValue("gray.800", "gray.100");
    const textMuted = useColorModeValue("gray.600", "gray.400");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const accentColor = useColorModeValue("blue.600", "blue.300");

    // Автоматически заполняем сумму заказа
    useEffect(() => {
        if (orderData?.totalSum) {
            setSum(orderData.totalSum.toString());
        }
    }, [orderData]);

    const formatPrice = (price) =>
        Number(price).toLocaleString("uz-UZ") + " so'm";

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

        setLoading(true);
        try {
            await onSumUpdated(paymentId, parseFloat(sum));

            toast({
                title: "Muvaffaqiyatli!",
                description: "To'lov qabul qilindi",
                status: "success",
                duration: 2000,
                isClosable: true,
            });

            setSum("");
            onClose();
        } catch (error) {
            console.log(error);
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

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="md" isCentered>
            <ModalOverlay backdropFilter="blur(4px)" />
            <ModalContent bg={bgModal}>
                <ModalHeader color={textPrimary}>
                    To'lov qilish
                    {orderData?.payNumber && (
                        <Text fontSize="sm" fontWeight="normal" color={textMuted} mt={1}>
                            {orderData.payNumber}
                        </Text>
                    )}
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        {/* Buyurtma ma'lumotlari */}
                        <Box
                            p={3}
                            bg={useColorModeValue("gray.50", "gray.700")}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor={borderColor}
                        >
                            <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm" color={textMuted}>
                                    Buyurtma summasi:
                                </Text>
                                <Text fontWeight="bold" color={accentColor}>
                                    {formatPrice(totalSum)}
                                </Text>
                            </HStack>

                            {orderData?.payMethod?.name && (
                                <HStack justify="space-between">
                                    <Text fontSize="sm" color={textMuted}>
                                        To'lov usuli:
                                    </Text>
                                    <Text fontSize="sm" color={textPrimary}>
                                        {orderData.payMethod.name}
                                    </Text>
                                </HStack>
                            )}
                        </Box>

                        <Divider />

                        {/* Summa input */}
                        <FormControl>
                            <FormLabel color={textPrimary}>
                                Qabul qilingan summa (so'm)
                            </FormLabel>
                            <NumberInput
                                value={sum}
                                onChange={(valueString) => setSum(valueString)}
                                min={0}
                                precision={2}
                            >
                                <NumberInputField
                                    placeholder="Summani kiriting"
                                    color={textPrimary}
                                    fontSize="lg"
                                    fontWeight="semibold"
                                    inputMode="numeric"
                                />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        </FormControl>

                        {/* Qaytim */}
                        {sum && parseFloat(sum) > 0 && (
                            <Box
                                p={3}
                                bg={changeSum >= 0
                                    ? useColorModeValue("green.50", "green.900")
                                    : useColorModeValue("red.50", "red.900")
                                }
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor={changeSum >= 0 ? "green.200" : "red.200"}
                            >
                                <HStack justify="space-between">
                                    <Text fontSize="sm" fontWeight="medium" color={textPrimary}>
                                        Qaytim:
                                    </Text>
                                    <Text
                                        fontSize="xl"
                                        fontWeight="bold"
                                        color={changeSum >= 0 ? "green.600" : "red.600"}
                                    >
                                        {formatPrice(Math.abs(changeSum))}
                                    </Text>
                                </HStack>
                                {changeSum < 0 && (
                                    <Text fontSize="xs" color="red.600" mt={1}>
                                        ⚠️ Summa buyurtma summasidan kam!
                                    </Text>
                                )}
                            </Box>
                        )}
                    </VStack>
                </ModalBody>

                <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
                    <Button
                        variant="ghost"
                        mr={3}
                        onClick={handleClose}
                        isDisabled={loading}
                    >
                        Bekor qilish
                    </Button>
                    <Button
                        colorScheme="green"
                        onClick={handleSubmit}
                        isLoading={loading}
                        loadingText="To'lanmoqda..."
                        isDisabled={!sum || parseFloat(sum) <= 0}
                    >
                        To'lovni tasdiqlash
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}