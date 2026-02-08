import React from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Box,
    Text,
    Divider,
    VStack,
    HStack,
    useColorModeValue,
} from "@chakra-ui/react";

export default function ReceiptModal({
    isOpen,
    onClose,
    paymentData,
    orderItems,
    onPaymentClick // Новый prop для открытия Editsummodal
}) {
    const bgReceipt = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.300", "gray.600");
    const textPrimary = useColorModeValue("gray.800", "gray.100");
    const textMuted = useColorModeValue("gray.600", "gray.400");

    // ─── Narxni formatlash ───
    const formatPrice = (price) =>
        Number(price).toLocaleString("uz-UZ") + " so'm";

    // ─── Sanani formatlash ───
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString("uz-UZ", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // ─── To'lov qilish tugmasi bosilganda ───
    const handlePayment = () => {
        onClose(); // Chekni yopish
        onPaymentClick(); // Editsummodal ochish
    };

    if (!paymentData) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
            isCentered
            scrollBehavior="inside"
        >
            <ModalOverlay />
            <ModalContent
                bg={bgReceipt}
                maxH="90vh"
            >
                <ModalHeader
                    textAlign="center"
                    borderBottomWidth="1px"
                    borderColor={borderColor}
                    position="sticky"
                    top={0}
                    bg={bgReceipt}
                    zIndex={1}
                >
                    <Text fontSize="2xl" fontWeight="bold" color={textPrimary}>
                        CHEK
                    </Text>
                </ModalHeader>

                <ModalBody
                    py={6}
                    id="receipt-content"
                    overflowY="auto"
                    maxH="calc(90vh - 140px)"
                >
                    <VStack spacing={4} align="stretch">
                        {/* Chek raqami va sana */}
                        <Box textAlign="center">
                            <Text fontSize="lg" fontWeight="bold" color={textPrimary}>
                                {paymentData.payNumber}
                            </Text>
                            <Text fontSize="sm" color={textMuted}>
                                {formatDate(paymentData.createdAt)}
                            </Text>
                        </Box>

                        <Divider borderColor={borderColor} />

                        {/* To'lov turi va status */}
                        <HStack justify="space-between">
                            <Text color={textMuted}>To'lov turi:</Text>
                            <Text fontWeight="semibold" color={textPrimary}>
                                {paymentData.type === "sale" ? "Naqd pul" : "Nasiya"}
                            </Text>
                        </HStack>

                        <HStack justify="space-between">
                            <Text color={textMuted}>Status:</Text>
                            <Text
                                fontWeight="semibold"
                                color={
                                    paymentData.status === "pending"
                                        ? "orange.500"
                                        : "green.500"
                                }
                            >
                                {paymentData.orderStatus === "pending" ? "Kutilmoqda" : "To'langan"}
                            </Text>
                        </HStack>

                        <Divider borderColor={borderColor} />

                        {/* Mahsulotlar ro'yxati */}
                        <Box>
                            <Text fontWeight="bold" mb={3} color={textPrimary}>
                                Mahsulotlar:
                            </Text>
                            <VStack spacing={2} align="stretch">
                                {orderItems.map((item, index) => (
                                    <HStack key={index} justify="space-between" fontSize="sm">
                                        <HStack flex={1}>
                                            <Text color={textMuted}>{index + 1}.</Text>
                                            <Text color={textPrimary}>{item.name}</Text>
                                            <Text color={textMuted}>x{item.count}</Text>
                                        </HStack>
                                        <Text fontWeight="semibold" color={textPrimary}>
                                            {formatPrice(item.price * item.count)}
                                        </Text>
                                    </HStack>
                                ))}
                            </VStack>
                        </Box>

                        <Divider borderColor={borderColor} />

                        {/* Jami summa */}
                        <HStack justify="space-between" py={2}>
                            <Text fontSize="lg" fontWeight="bold" color={textPrimary}>
                                JAMI:
                            </Text>
                            <Text fontSize="xl" fontWeight="bold" color="blue.500">
                                {formatPrice(paymentData.totalSum)}
                            </Text>
                        </HStack>

                        {/* Qabul qilingan va qaytim */}
                        {paymentData.type === "cash" && (
                            <>
                                <HStack justify="space-between">
                                    <Text color={textMuted}>Qabul qilindi:</Text>
                                    <Text fontWeight="semibold" color={textPrimary}>
                                        {formatPrice(paymentData.receivedSum)}
                                    </Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text color={textMuted}>Qaytim:</Text>
                                    <Text fontWeight="semibold" color={textPrimary}>
                                        {formatPrice(paymentData.changeSum)}
                                    </Text>
                                </HStack>
                            </>
                        )}

                        <Divider borderColor={borderColor} />

                        {/* Footer */}
                        <Box textAlign="center" pt={2}>
                            <Text fontSize="xs" color={textMuted}>
                                Xaridingiz uchun rahmat!
                            </Text>
                            <Text fontSize="xs" color={textMuted}>
                                ID: {paymentData.id}
                            </Text>
                        </Box>
                    </VStack>
                </ModalBody>

                <ModalFooter
                    borderTopWidth="1px"
                    borderColor={borderColor}
                    position="sticky"
                    bottom={0}
                    bg={bgReceipt}
                    zIndex={1}
                >
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Keyinroq to'lov qilish
                    </Button>
                    <Button colorScheme="green" onClick={handlePayment}>
                        To'lov qilish
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}