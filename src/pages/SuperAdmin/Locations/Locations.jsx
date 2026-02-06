import {
    Box,
    SimpleGrid,
    Card,
    CardBody,
    Text,
    IconButton,
    Flex,
    Badge,
    VStack,
    Link,
    useDisclosure,
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
    useColorModeValue,
} from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import { Warehouse } from "lucide-react";
import { useEffect, useState } from "react";
import { apiLocations } from "../../../utils/Controllers/apiLocations";

// import axios from "axios";

export default function WarehousesPage() {
    const cardBg = useColorModeValue("surface", "surface");
    const pageBg = useColorModeValue("bg", "bg");
    const [warehouses, setWarehouses] = useState([])

    // === MOCK DATA (API o‘rniga) ===


    const fetchWarehouses = async () => {
        try {
            const res = await apiLocations.getWarehouses();
            setWarehouses(res.data)
        } finally { }
    };
    useEffect(()=> {
        fetchWarehouses()
    },[])

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [editingWarehouse, setEditingWarehouse] = useState(null);

    const handleEdit = (warehouse) => {
        setEditingWarehouse(warehouse);
        onOpen();
    };

    return (
        <Box bg={pageBg} minH="100vh" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
            <Box maxW="1100px" mx="auto">
                <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="600" mb={6}>
                    Omborlar
                </Text>

                {warehouses.length === 0 ? (
                    <Flex
                        direction="column"
                        align="center"
                        justify="center"
                        py={20}
                        color="neutral.500"
                    >
                        <Warehouse size={40} />
                        <Text mt={3}>Ombor topilmadi</Text>
                    </Flex>
                ) : (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        {warehouses.map((wh, idx) => (
                            <Card
                                key={idx}
                                bg={cardBg}
                                rounded="2xl"
                                border="1px solid"
                                borderColor="border"
                                position="relative"
                            >
                                <IconButton
                                    icon={<EditIcon />}
                                    aria-label="edit"
                                    size="sm"
                                    position="absolute"
                                    top="12px"
                                    right="12px"
                                    variant="ghost"
                                    onClick={() => handleEdit(wh)}
                                />

                                <CardBody>
                                    <VStack align="start" spacing={3}>
                                        <Text fontWeight="600" fontSize="lg">
                                            {wh.name}
                                        </Text>

                                        <Text fontSize="sm" color="neutral.500">
                                            {wh.address}
                                        </Text>

                                        <Link
                                            href={`tel:${wh.phone}`}
                                            fontSize="sm"
                                            color="link"
                                        >
                                            {wh.phone}
                                        </Link>
                                    </VStack>
                                </CardBody>
                            </Card>
                        ))}
                    </SimpleGrid>
                )}
            </Box>

            {/* EDIT MODAL */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent bg={cardBg}>
                    <ModalHeader>Omborni tahrirlash</ModalHeader>
                    <ModalBody>
                        {editingWarehouse && (
                            <VStack spacing={4}>
                                <FormControl>
                                    <FormLabel>Nomi</FormLabel>
                                    <Input defaultValue={editingWarehouse.name} />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Telefon</FormLabel>
                                    <Input defaultValue={editingWarehouse.phone} />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Manzil</FormLabel>
                                    <Input defaultValue={editingWarehouse.address} />
                                </FormControl>
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Bekor qilish
                        </Button>
                        <Button colorScheme="blue">
                            Saqlash
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}
