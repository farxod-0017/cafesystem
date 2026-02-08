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
} from "@chakra-ui/react";
import { useState } from "react";

export default function EditSumModal({ isOpen, onClose, paymentId, onSumUpdated }) {
    const [sum, setSum] = useState("");
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const bgModal = useColorModeValue("white", "gray.800");
    const textPrimary = useColorModeValue("gray.800", "gray.100");
    const textMuted = useColorModeValue("gray.600", "gray.400");

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
            // Call the parent function to update sum
            await onSumUpdated(paymentId, parseFloat(sum));

            toast({
                title: "Summa yangilandi!",
                status: "success",
                duration: 2000,
                isClosable: true,
            });

            // Reset and close
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

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="md" isCentered>
            <ModalOverlay backdropFilter="blur(4px)" />
            <ModalContent bg={bgModal}>
                <ModalHeader color={textPrimary}>Qabul qilingan summa</ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Text fontSize="sm" color={textMuted}>
                            To'lov summasini kiriting
                        </Text>

                        <FormControl>
                            <FormLabel color={textPrimary}>Summa (so'm)</FormLabel>
                            <NumberInput
                                value={sum}
                                onChange={(valueString) => setSum(valueString)}
                                min={0}
                                precision={2}
                            >
                                <NumberInputField
                                    placeholder="Summani kiriting"
                                    color={textPrimary}
                                    inputMode="numeric"
                                />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        </FormControl>

                        {sum && parseFloat(sum) > 0 && (
                            <Text fontSize="lg" fontWeight="semibold" color="blue.500">
                                {parseFloat(sum).toLocaleString("uz-UZ")} so'm
                            </Text>
                        )}
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button
                        variant="ghost"
                        mr={3}
                        onClick={handleClose}
                        isDisabled={loading}
                    >
                        Bekor qilish
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={handleSubmit}
                        isLoading={loading}
                        loadingText="Saqlanmoqda..."
                    >
                        Saqlash
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}