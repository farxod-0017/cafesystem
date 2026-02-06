import { Box, Button, Code, Heading, Spinner, Table, Tbody, Td, Th, Thead, Tr, useDisclosure } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import TableSkeleton from "../../../components/ui/TableSkeleton";
import { apiManagers } from "../../../utils/Controllers/Managers";
import ManagerModal from "./_components/ManagerModal";
import ConfirmDelModal from "../../../components/common/ConfirmDelModal";
import ResetPassModal from "../../../components/common/ResetPassModal";
import CopyUsername from "../../../components/common/CopyUsername";
import { formatDateTime } from "../../../utils/tools/formatDateTime";

export default function SPmanagers() {
    const formModal = useDisclosure();
    const confirmModal = useDisclosure();
    const resetPassModal = useDisclosure();

    const clickCount = useRef(0);
    const timer = useRef(null);
    const delay = 200;

    // UI states
    const [tableLoading, setTableLoading] = useState(false);
    const [delLoading, setDelLoading] = useState(false);
    const [resettingPassUser, setResettingPassUser] = useState(null);
    const [validating, setValidating] = useState(false);

    // data states
    const [managers, setManagers] = useState([]);
    const [editingManager, setEditingManager] = useState(null);
    const [deletingManger, setDeletingManager] = useState(null);
    const [pass, setPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("")

    // GET
    const fetchManagers = async () => {
        try {
            if (managers.length === 0) setTableLoading(true);

            const res = await apiManagers.All();
            if (res.status === 200 || res.status === 201) {
                setManagers(res.data || []);
            }
        } finally {
            setTableLoading(false)
        }
    };
    useEffect(() => {
        fetchManagers()
    }, []);

    // DELETE
    const deleteManager = async (id) => {
        try {
            setDelLoading(true)
            const res = await apiManagers.Delete(id);
            if (res.status === 200 || res.status === 201) {
                confirmModal.onClose()
                fetchManagers();
            }
        } finally {
            setDelLoading(false)
        }
    };
    // Local control clickes on edit
    const handleClick = (item) => {
        clickCount.current += 1;

        if (timer.current) return;

        timer.current = setTimeout(() => {
            if (clickCount.current === 1) {
                // single click logic
                console.log("SINGLE CLICK");
                setEditingManager(item);
                formModal.onOpen();
            }

            if (clickCount.current === 2) {
                // double click logic
                setResettingPassUser(item);
                resetPassModal.onOpen();
                setPass("");
                setConfirmPass("");
            }

            // reset
            clickCount.current = 0;
            timer.current = null;
        }, delay);
    };

    return (
        <Box p={6} maxW="1500px" mx="auto" bg={"bg"} color={"text"}>
            <Box display="flex" justifyContent="space-between" mb={6}>
                <Heading size="lg">Foydalanuvchilar</Heading>

                <Button
                    variant={"solidPrimary"}
                    onClick={() => {
                        setEditingManager(null);
                        formModal.onOpen();
                    }}
                >
                    + Foydalanuvchi yaratish
                </Button>
            </Box>
            {/* TABLE */}
            <Box
                bg="bg"
                rounded="xl"
                shadow="md"
                overflow="hidden"
                p={4}
            >
                {tableLoading ? (
                    <Box textAlign="center">
                        <Table>
                            <Thead bg={"surface"}>
                                <Tr>
                                    <Th>#</Th>
                                    <Th>F.I.O</Th>
                                    <Th>Login</Th>
                                    <Th>Yaratilgan vaqti</Th>
                                    <Th>Oxirgi o'zgartirilgan</Th>
                                    <Th textAlign="right">Amallar</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                <TableSkeleton rows={8} columns={6} />
                            </Tbody>
                        </Table>
                        {/* <Spinner marginTop={"10px"} size="lg" /> */}
                    </Box>
                ) : managers.length > 0 ? (
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>#</Th>
                                <Th>F.I.O</Th>
                                <Th>Login</Th>
                                <Th>Yaratilgan vaqti</Th>
                                <Th>Oxirgi o'zgartirilgan</Th>
                                <Th textAlign="right">Amallar</Th>
                            </Tr>
                        </Thead>

                        <Tbody>
                            {managers.map((item, index) => (
                                <Tr key={item.id}>
                                    <Td>{index + 1}</Td>
                                    <Td>{item.full_name}</Td>
                                    <Td><CopyUsername username={item.username} /></Td>
                                    <Td>{formatDateTime(item.createdAt, 'uz-UZ', {
                                        month: 'numeric'
                                    })}</Td>
                                    <Td>{formatDateTime(item.updatedAt, 'uz-Uz', {
                                        month: 'numeric'
                                    })}</Td>
                                    <Td textAlign="right">
                                        <Button
                                            size="sm"
                                            colorScheme="blue"
                                            variant="ghost"
                                            onClick={() => {
                                                handleClick(item)
                                            }}
                                        >
                                            Tahrirlash
                                        </Button>
                                        <Button
                                            size="sm"
                                            colorScheme="red"
                                            variant="ghost"
                                            onClick={() => {
                                                setDeletingManager(item);
                                                confirmModal.onOpen();
                                            }}
                                        >
                                            O'chirish
                                        </Button>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                ) : (
                    <Box textAlign="center" py={6} color="gray.500">
                        No managers found
                    </Box>
                )}
            </Box>
            {/* MODAL */}
            <ManagerModal isOpen={formModal.isOpen} onClose={formModal.onClose} reload={fetchManagers} initialData={editingManager} />
            <ConfirmDelModal isOpen={confirmModal.isOpen} onClose={confirmModal.onClose} itemName={deletingManger?.full_name} typeItem={"Manager"} loading={delLoading} onConfirm={() => deleteManager(deletingManger?.id)} />
            <ResetPassModal pass={pass} confirmPass={confirmPass}
                setPass={setPass} setConfirmPass={setConfirmPass}
                validating={validating} setValidating={setValidating}
                isOpen={resetPassModal.isOpen}
                onClose={() => {
                    resetPassModal.onClose()
                    setValidating(false)
                }}
                user={resettingPassUser} typeItem={"manager"} />
        </Box>
    )
}