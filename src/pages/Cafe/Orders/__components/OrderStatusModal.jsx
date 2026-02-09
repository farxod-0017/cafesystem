import { useState } from "react";
import {
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    Button,
    Badge,
    useToast,
    Text,
    VStack,
    Box,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { apiPayment } from "../../../../utils/Controllers/apiPayment";

const STATUS_OPTIONS = [
    { value: "pending", label: "Kutilmoqda", color: "yellow" },
    { value: "preparing", label: "Tayyorlanmoqda", color: "blue" },
    { value: "ready", label: "Tayyor", color: "green" },
    { value: "completed", label: "Yakunlangan", color: "teal" },
];

export default function OrderStatusMenu({ order, onStatusUpdated }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    if (!order) return null;

    const currentStatus = order.orderStatus || "pending";
    const currentStatusInfo = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[0];

    // Statusni o'zgartirish
    const handleStatusChange = async (newStatus) => {
        if (isSubmitting || newStatus === currentStatus) return;

        try {
            setIsSubmitting(true);

            const data = {
                orderStatus: newStatus,
                note: `Status o'zgartirildi: ${currentStatusInfo.label} → ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}`
            };

            await apiPayment.EditStatus(order.id, data);

            toast({
                title: "Muvaffaqiyatli",
                description: `Status "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}" ga o'zgartirildi`,
                status: "success",
                duration: 2000,
                position: "top-right",
            });

            onStatusUpdated?.();
        } catch (error) {
            toast({
                title: "Xatolik",
                description: error.response?.data?.message || "Statusni o'zgartirishda xatolik",
                status: "error",
                duration: 3000,
                position: "top-right",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Menu>
            <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                size="sm"
                colorScheme={currentStatusInfo.color}
                variant="outline"
                isLoading={isSubmitting}
                loadingText={currentStatusInfo.label}
            >
                <Badge colorScheme={currentStatusInfo.color} fontSize="xs">
                    {currentStatusInfo.label}
                </Badge>
            </MenuButton>

            <MenuList minW="200px" zIndex={10}>
                <Box px={3} py={2} borderBottomWidth="1px">
                    <Text fontSize="xs" fontWeight="bold" color="gray.500">
                        Statusni o'zgartirish
                    </Text>
                </Box>

                <VStack spacing={0} align="stretch" py={1}>
                    {STATUS_OPTIONS.map((option) => (
                        <MenuItem
                            key={option.value}
                            onClick={() => handleStatusChange(option.value)}
                            isDisabled={option.value === currentStatus}
                            fontSize="sm"
                            py={2}
                        >
                            <Badge
                                colorScheme={option.color}
                                fontSize="xs"
                                width="100%"
                                textAlign="center"
                            >
                                {option.label}
                            </Badge>
                        </MenuItem>
                    ))}
                </VStack>
            </MenuList>
        </Menu>
    );
}