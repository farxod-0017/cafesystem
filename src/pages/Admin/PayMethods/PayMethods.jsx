import {
    Box,
    Button,
    Card,
    CardBody,
    Flex,
    Heading,
    IconButton,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    SimpleGrid,
    Text,
    useColorModeValue,
    useDisclosure,
    useToast,
    Skeleton,
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay
} from "@chakra-ui/react";
import { EditIcon, DeleteIcon, AddIcon } from "@chakra-ui/icons";
import { useEffect, useRef, useState } from "react";
import { apiPayMethods } from "../../../utils/Controllers/apiPayMethods";
import { apiLocations } from "../../../utils/Controllers/apiLocations";

// ==================================================
// Axios so‘rovlarini bu joyga ulaysiz
// ==================================================
// axios.get('/pay-methods')
// axios.post('/pay-methods', { name })
// axios.put(`/pay-methods/${id}`, { name })
// axios.delete(`/pay-methods/${id}`)

export default function PayMethodsPage() {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [locations, setLocations] = useState([])
    // -------------------- PAGE STATE --------------------
    const [items, setItems] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);

    // -------------------- CREATE / EDIT --------------------
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [submitting, setSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState(null); // { id, name }
    const [name, setName] = useState("");

    // -------------------- DELETE --------------------
    const {
        isOpen: isDeleteOpen,
        onOpen: onDeleteOpen,
        onClose: onDeleteClose
    } = useDisclosure();
    const cancelRef = useRef();
    const [deleting, setDeleting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchWarehouses = async () => {
        try {
            // const res = await axios.get('/locations');
            const res = await apiLocations.getWarehouses()
            setLocations(res.data);
            setSelectedLocation(res.data?.[0] || null);
        }finally {
        }
    };  

    // -------------------- FETCH LIST --------------------
    const fetchPayMethods = async () => {
        try {
            setPageLoading(true);

            // const res = await axios.get('/pay-methods');
            // setItems(res.data);
            const res = await apiPayMethods.getAll();
            const filtered = res.data.payMethods.filter(pm => pm.locationId === selectedLocation?.id);
            setItems(filtered);

        } finally {
            setPageLoading(false);
        }
    };
    
    useEffect(() => {
        fetchWarehouses();
    }, []);
    useEffect(() => {
        if(selectedLocation) fetchPayMethods();
    }, [selectedLocation]);

    // -------------------- CREATE / UPDATE --------------------
    const handleSubmit = async () => {
        if (name.trim() === "" ) return;

        try {
            setSubmitting(true);

            if (editingItem) {

                // await axios.put(`/pay-methods/${editingItem.id}`, { name });
                await apiPayMethods.Update({ name }, editingItem.id);
                fetchPayMethods();
            } else {
                if(!selectedLocation) return;
                await apiPayMethods.Add({ name, locationId: selectedLocation.id });
                fetchPayMethods()
            }

            onClose();
            setName("");
            setEditingItem(null);
        } finally {
            setSubmitting(false);
        }
    };

    // -------------------- DELETE --------------------
    const handleDelete = async () => {
        try {
            setDeleting(true);

            // await axios.delete(`/pay-methods/${deleteTarget.id}`);
            await apiPayMethods.Delete(deleteTarget.id);
            onDeleteClose();
            fetchPayMethods()
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Box p={6}>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="md">To'lov usullari</Heading>
                <Button variant={"solidPrimary"} leftIcon={<AddIcon />} onClick={() => {
                    setName("")
                    setEditingItem(null);
                    onOpen();
                }}>
                    Yangi qo‘shish
                </Button>
            </Flex>
            {/* Location selector */}
            <Flex mb={4} gap={"16px"}>
                {locations.map((location) => (
                    <Button
                        key={location.id}
                        variant={selectedLocation?.id === location.id ? "solidPrimary" : "outlinePrimary"}
                        onClick={() => setSelectedLocation(location)}
                    >
                        {location.name}
                    </Button>
                ))}
            </Flex>


            {/* -------------------- LIST -------------------- */}
            {pageLoading ? (
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} h="120px" rounded="xl" />
                    ))}
                </SimpleGrid>
            ) : items.length === 0 ? (
                <Text color="neutral.500">Pay methodlar mavjud emas</Text>
            ) : (
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    {items.map((item) => (
                        <Card
                            key={item.id}
                            bg={"surface"}
                            rounded="xl"
                            role="group"
                        >
                            <CardBody>
                                <Flex justify="space-between" align="center">
                                    <Text fontWeight="600">{item.name}</Text>

                                    <Flex
                                        gap={2}
                                        opacity={0}
                                        _groupHover={{ opacity: 1 }}
                                        transition="0.2s"
                                    >
                                        <IconButton
                                            size="sm"
                                            aria-label="edit"
                                            icon={<EditIcon />}
                                            onClick={() => {
                                                setEditingItem(item);
                                                setName(item.name);
                                                onOpen();
                                            }}
                                        />
                                        <IconButton
                                            size="sm"
                                            aria-label="delete"
                                            icon={<DeleteIcon />}
                                            onClick={() => {
                                                setDeleteTarget(item);
                                                onDeleteOpen();
                                            }}
                                        />
                                    </Flex>
                                </Flex>
                            </CardBody>
                        </Card>
                    ))}
                </SimpleGrid>
            )}

            {/* -------------------- CREATE / EDIT MODAL -------------------- */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {editingItem ? "To'lov usuli tahrirlash" : "To'lov usuli yaratish"}
                    </ModalHeader>
                    <ModalBody>
                        <Input
                            placeholder="Nomi"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button mr={3} variant="ghost" onClick={onClose}>
                            Bekor qilish
                        </Button>
                        <Button onClick={handleSubmit} isLoading={submitting}>
                            Saqlash
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* -------------------- DELETE CONFIRM -------------------- */}
            <AlertDialog
                isOpen={isDeleteOpen}
                leastDestructiveRef={cancelRef}
                onClose={onDeleteClose}
            >
                <AlertDialogOverlay />
                <AlertDialogContent>
                    <AlertDialogHeader>O‘chirish</AlertDialogHeader>
                    <AlertDialogBody>
                        <Text>
                            <b>{deleteTarget?.name}</b> o‘chirilsinmi?
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onDeleteClose}>
                            Yo‘q
                        </Button>
                        <Button ml={3} onClick={handleDelete} isLoading={deleting}>
                            Ha, o‘chirish
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Box>
    );
}
