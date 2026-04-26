import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    FormControl,
    FormLabel,
    Input,
    FormErrorMessage,
    Spacer,
    Select
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { apiManagers } from "../../../../utils/Controllers/Managers";
import { init } from "i18next";


export default function ManagerModal({ isOpen, onClose, initialData, reload }) {
    // UI states
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);

    // form states
    const [form, setForm] = useState({
        full_name: "",
        username: "",
        password: "",
        role: ""
    });

    // ---- Functions
    const changeInput = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    };
    useEffect(() => {
        if (initialData) {
            setForm({ ...form, username: initialData?.username, full_name: initialData?.full_name, })
        } else {
            setForm({
                full_name: "",
                username: "",
                password: "",
                role: ""
            })
        }
    }, [initialData]);

    // POST
    const addManager = async () => {
        if (!form.full_name || !form.username || !form.password) {
            setValidating(true);
            return;
        }
        try {
            setLoading(true)
            const res = await apiManagers.Add(form);
            if (res.status === 200 || res.status === 201) {
                onClose();
                reload();
                setForm({
                    full_name: "",
                    username: "",
                    password: "",
                    role: "admin"
                })
            }
        } finally {
            setLoading(false)
        }
    };
    // PUT
    const updateManager = async () => {
        try {
            setLoading(true);
            const { password, role, ...payload } = form
            const res = await apiManagers.Update(payload, initialData?.id);
            if (res.status === 200 || res.status === 201) {
                onClose();
                reload();
                setForm({
                    full_name: "",
                    username: "",
                    password: "",
                    role: "admin"
                });
            }
        } finally {
            setLoading(false)
        }
    };
    const handleSubmit = () => {
        if (initialData) {
            updateManager()
        } else {
            addManager()
        }
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(6px)" />
            <ModalContent>
                <ModalHeader>
                    {initialData ? "Foydalanuvchini tahrirlash" : "Foydalanuvchi yaratish"}
                </ModalHeader>

                <ModalBody>
                    {!initialData && 
                    <FormControl>
                        <FormLabel> Role tanlang </FormLabel>
                        <Select
                            name="role"
                            value={form.role}
                            onChange={changeInput}
                            variant="filledPrimary"
                        >
                            <option value="" disabled>role tanlang</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SELLER">Sotuvchi</option>
                        </Select>

                    </FormControl> }
                    <FormControl isInvalid={!form.full_name && validating}>
                        <FormLabel>F I O</FormLabel>
                        <Input
                            name="full_name"
                            value={form.full_name}
                            onChange={(e) => changeInput(e)}
                            placeholder="Enter name"
                        />
                        <FormErrorMessage>
                            F.I.O kiritilishi shart
                        </FormErrorMessage>
                    </FormControl>
                    <Spacer h={2} />
                    <FormControl isInvalid={!form.username && validating}>
                        <FormLabel>Login</FormLabel>
                        <Input
                            name="username"
                            value={form.username}
                            onChange={(e) => changeInput(e)}
                            placeholder="Enter username"
                        />
                        <FormErrorMessage>
                            Login kiritilishi shart
                        </FormErrorMessage>
                    </FormControl>
                    <Spacer h={2} />
                    {!initialData &&
                        <FormControl isInvalid={!form.password && validating}>
                            <FormLabel>Parol</FormLabel>
                            <Input
                                name="password"
                                value={form.password}
                                onChange={(e) => changeInput(e)}
                                placeholder="Enter password"
                            />
                            <FormErrorMessage>
                                Parol kiritilishi shart
                            </FormErrorMessage>
                        </FormControl>
                    }
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Bekor qilish
                    </Button>

                    <Button
                        isLoading={loading}
                        loadingText="Saqlanmoqda..."
                        colorScheme="blue"
                        onClick={handleSubmit}
                    >
                        Saqlash
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}