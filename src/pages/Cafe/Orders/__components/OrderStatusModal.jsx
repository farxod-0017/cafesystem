import { useState } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    Button,
    VStack,
    Text,
    Textarea,
    FormControl,
    FormLabel,
    useColorModeValue,
    useToast,
} from "@chakra-ui/react";
import { apiPayment } from "../../../../utils/Controllers/apiPayment";

// Status workflow ma'lumotlari
const STATUS_WORKFLOW = {
    pending: {
        next: "preparing",
        label: "Kutilmoqda",
        nextLabel: "Tayyorlanmoqda",
        color: "yellow",
        description: "Buyurtma qabul qilindi, tayyorlashni boshlash"
    },
    preparing: {
        next: "ready",
        label: "Tayyorlanmoqda",
        nextLabel: "Tayyor",
        color: "blue",
        description: "Mahsulotlar tayyorlanmoqda, yakunlash"
    },
    ready: {
        next: "completed",
        label: "Tayyor",
        nextLabel: "Yakunlangan",
        color: "green",
        description: "Buyurtma tayyor, mijozga topshirish"
    },
    completed: {
        next: null,
        label: "Yakunlangan",
        nextLabel: null,
        color: "teal",
        description: "Buyurtma muvaffaqiyatli yakunlandi"
    }
};

const STATUS_OPTIONS = [
    { value: "pending", label: "Kutilmoqda", color: "yellow" },
    { value: "preparing", label: "Tayyorlanmoqda", color: "blue" },
    { value: "ready", label: "Tayyor", color: "green" },
    { value: "completed", label: "Yakunlangan", color: "teal" },
    { value: "cancelled", label: "Bekor qilingan", color: "red" },
];

export default function OrderStatusModal({
    isOpen,
    onClose,
    order,
    onStatusUpdated
}) {
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toast = useToast();
    const textPrimary = useColorModeValue("gray.800", "gray.100");
    const textMuted = useColorModeValue("gray.500", "gray.400");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const bgCard = useColorModeValue("white", "gray.800");
    const inputBg = useColorModeValue("white", "gray.700");

    if (!order) return null;

    const currentStatus = order.status || "pending";
    const currentStatusInfo = STATUS_WORKFLOW[currentStatus] || {};
    const nextStatus = currentStatusInfo.next;

    // Statusni o'zgartirish
    const handleStatusChange = async (newStatus) => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);

            const data = {
                orderStatus: newStatus,
                note: note.trim() || "Status updated"
            };

            await apiPayment.EditStatus(order.id, data);

            toast({
                title: "Muvaffaqiyatli",
                description: `Status "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}" ga o'zgartirildi`,
                status: "success",
                duration: 3000,
            });

            // Note ni tozalash
            setNote("");

            onStatusUpdated?.();
            onClose();
        } catch (error) {
            console.error("Status update error:", error);
            toast({
                title: "Xatolik",
                description: error.response?.data?.message || "Statusni o'zgartirishda xatolik yuz berdi",
                status: "error",
                duration: 3000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Bekor qilish
    const handleCancel = () => {
        const cancelNote = "Bekor qilindi" + (note ? `: ${note}` : "");
        handleStatusChange("cancelled");
    };

    // Note uchun placeholderlar
    const getNotePlaceholder = (status) => {
        const placeholders = {
            preparing: "Misol: 20 daqiqa davom etadi, katta buyurtma...",
            ready: "Misol: Mijoz kelishini kutmoqda, oziq-ovqat issiq...",
            completed: "Misol: Mijozga topshirildi, naqd to'lov qabul qilindi...",
            cancelled: "Misol: Mijoz bekor qildi, mahsulot yo'q...",
            pending: "Misol: To'lovni kutmoqda, tasdiqlash kerak..."
        };
        return placeholders[status] || "Izoh qoldiring...";
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalOverlay bg="blackAlpha.600" />
            <ModalContent bg={bgCard} borderRadius="xl">
                <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
                    <Text color={textPrimary}>Statusni o'zgartirish</Text>
                    <Text fontSize="sm" color={textMuted} fontWeight="normal">
                        {order.payNumber}
                    </Text>
                </ModalHeader>
                <ModalCloseButton
                    color={textPrimary}
                    onClick={() => {
                        setNote("");
                        onClose();
                    }}
                />

                <ModalBody py={6}>
                    <VStack spacing={4} align="stretch">
                        {/* Joriy holat */}
                        <Text color={textPrimary} fontWeight="medium">
                            Joriy holat:{" "}
                            <Text as="span" color={`${currentStatusInfo.color}.500`}>
                                {currentStatusInfo.label}
                            </Text>
                        </Text>

                        {/* Tavsif */}
                        {currentStatusInfo.description && (
                            <Text fontSize="sm" color={textMuted}>
                                {currentStatusInfo.description}
                            </Text>
                        )}

                        {/* Note input */}
                        <FormControl>
                            <FormLabel fontSize="sm" color={textMuted}>
                                Izoh (ixtiyoriy)
                            </FormLabel>
                            <Textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder={getNotePlaceholder(currentStatus)}
                                size="sm"
                                bg={inputBg}
                                borderColor={borderColor}
                                color={textPrimary}
                                _placeholder={{ color: textMuted }}
                                rows={3}
                                resize="vertical"
                            />
                        </FormControl>


                        {/* Boshqa statuslar */}
                        <Text fontSize="sm" color={textMuted} mt={4}>
                            Boshqa holatlar:
                        </Text>

                        <VStack spacing={2}>
                            {STATUS_OPTIONS
                                .filter(option =>
                                    option.value !== currentStatus &&
                                    option.value !== "cancelled"
                                )
                                .map((option) => (
                                    <Button
                                        key={option.value}
                                        variant="outline"
                                        colorScheme={option.color}
                                        width="100%"
                                        onClick={() => handleStatusChange(option.value)}
                                        size="sm"
                                        isLoading={isSubmitting}
                                    >
                                        {option.label} ga o'tkazish
                                    </Button>
                                ))
                            }
                        </VStack>
                    </VStack>
                </ModalBody>

                <ModalFooter borderTopWidth="1px" borderColor={borderColor} pt={4}>
                    <VStack width="100%" spacing={3}>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setNote("");
                                onClose();
                            }}
                            color={textPrimary}
                            width="100%"
                        >
                            Yopish
                        </Button>
                    </VStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}