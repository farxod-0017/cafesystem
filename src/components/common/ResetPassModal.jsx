import {
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Button,
    Text,
    FormControl,
    FormLabel,
    Input,
    FormErrorMessage,
    Spacer,
} from "@chakra-ui/react";
import { useState } from "react";
import { apiUsers } from "../../utils/Controllers/Users";

export default function ResetPassModal({ pass, confirmPass, setPass, setConfirmPass, validating, setValidating, isOpen, onClose, user, typeItem }) {
    const [loading, setLoading] = useState(false);

    const updatePassword = async () => {
        setValidating(true);
        if (!pass || pass !== confirmPass) return;

        const data = {
            new_password: pass
        };
        try {
            setLoading(true)
            const res = await apiUsers.ResetPassword(user?.id, data);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(6px)" />

            <ModalContent>
                <ModalHeader>Change password</ModalHeader>

                <ModalBody>
                    <Text>Are you sure you want to reset this {typeItem} password?</Text>
                    <Text color={"red.400"}>{user?.full_name}</Text>
                    <FormControl isInvalid={!pass && validating}>
                        <FormLabel>New password</FormLabel>
                        <Input
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            placeholder="Enter new password"
                        />
                        <FormErrorMessage>
                            Password should not be empty
                        </FormErrorMessage>
                    </FormControl>
                    <Spacer h={2} />
                    <FormControl isInvalid={pass !== confirmPass && validating}>
                        <FormLabel>Confirm Password</FormLabel>
                        <Input
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            placeholder="Confirm new password"
                        />
                        <FormErrorMessage>
                            Confirmation password is not equal to password
                        </FormErrorMessage>
                    </FormControl>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button isLoading={loading} loadingText="Saqlanmoqda..." colorScheme="blue" onClick={() => updatePassword()}>
                        Save
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
