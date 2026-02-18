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
    Textarea,
    useColorModeValue,
    useDisclosure,
    useToast,
    Skeleton,
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Select,
    Image,
    Badge,
    ModalCloseButton,
    Grid,
    Spinner
} from "@chakra-ui/react";
import { EditIcon, DeleteIcon, AddIcon } from "@chakra-ui/icons";
import { useEffect, useRef, useState } from "react";
import { apiCategories } from "../../../utils/Controllers/apiCategories";
import { BASE_URL } from "../../../utils/api/axios";
import { IMAGE_URL } from "../../../constants/imageUrl";
import { Move } from "lucide-react";

// ==================================================
// Axios so‘rovlarini bu joyga ulaysiz
// ==================================================
// axios.get('/categories')
// axios.post('/categories', formData)
// axios.put(`/categories/${id}`, formData)
// axios.delete(`/categories/${id}`)

export default function CategoriesPage() {
    const [COUNT, setCOUNT] = useState(1)
    const bg = useColorModeValue("white", "gray.800");
    const modalBg = useColorModeValue("white", "gray.900");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const [selected, setSelected] = useState(null);
    const [indexing, setIndexing] = useState(false);

    const toast = useToast();
    const cardBg = useColorModeValue("surface", "surface");
    const [detailedImage, setDetailedImage] = useState(null);
    const detailedImageModal = useDisclosure();

    // -------------------- PAGE STATE --------------------
    const [items, setItems] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);

    // -------------------- FORM STATE --------------------
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [submitting, setSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [name, setName] = useState("");
    const [note, setNote] = useState("");

    // image handling
    const [imageFile, setImageFile] = useState(null); // File
    const [imagePreview, setImagePreview] = useState(null); // string

    // -------------------- DELETE --------------------
    const {
        isOpen: isDeleteOpen,
        onOpen: onDeleteOpen,
        onClose: onDeleteClose
    } = useDisclosure();
    const {
        isOpen: isSortOpen,
        onOpen: onSortOpen,
        onClose: onSortClose
    } = useDisclosure();
    const cancelRef = useRef();
    const [deleting, setDeleting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // -------------------- FETCH --------------------
    const fetchCategories = async () => {
        try {
            setPageLoading(true);
            // const res = await axios.get('/categories');
            // setItems(res.data);
            const res = await apiCategories.All();
            setItems(res.data.categories);
            setCOUNT(res.data.categories?.length)
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // -------------------- IMAGE CHANGE --------------------
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast({ title: "Faqat rasm yuklash mumkin", status: "warning" });
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    // -------------------- RESET FORM --------------------
    const resetForm = () => {
        setName("");
        setNote("");
        setImageFile(null);
        setImagePreview(null);
        setEditingItem(null);
    };

    // -------------------- SUBMIT --------------------
    const handleSubmit = async () => {
        if (!name) return;

        const formData = new FormData();
        formData.append("name", name);
        if (note) formData.append("note", note);
        if (imageFile) formData.append("image", imageFile);

        try {
            setSubmitting(true);
            if (editingItem) {
                // await axios.put(`/categories/${editingItem.id}`, formData);
                await apiCategories.Update(formData, editingItem.id)
            } else {
                // await axios.post('/categories', formData);
                await apiCategories.Add(formData)
            }

            onClose();
            resetForm();
            fetchCategories();
        } finally {
            setSubmitting(false);
        }
    };

    // -------------------- DELETE --------------------
    const handleDelete = async () => {
        try {
            setDeleting(true);
            // await axios.delete(`/categories/${deleteTarget.id}`);
            await apiCategories.Delete(deleteTarget.id)
            onDeleteClose();
            fetchCategories();
        } finally {
            setDeleting(false);
        }
    };

    const handleIndexNumber = async (newSortIndex) => {
        setIndexing(true);
        try {
            const data = {
                sort: String(newSortIndex)
            }
            const res = await apiCategories.Update(data, selected?.id);
            fetchCategories();
            const newSelected = res.data?.category;
            setSelected(newSelected)

        } finally {
            setIndexing(false);
        }
    }

    return (
        <Box p={6}>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="md">Kategoriyalar</Heading>
                <Button leftIcon={<AddIcon />} onClick={() => {
                    resetForm();
                    onOpen();
                }}>
                    Yangi qo‘shish
                </Button>
            </Flex>

            {/* -------------------- LIST -------------------- */}
            {pageLoading ? (
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} h="220px" rounded="xl" />
                    ))}
                </SimpleGrid>
            ) : items.length === 0 ? (
                <Text color="neutral.500">Categorylar mavjud emas</Text>
            ) : (
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    {items.map((item) => (
                        <Card
                            key={item.id}
                            bg={cardBg}
                            rounded="xl"
                            role="group"
                            position="relative"
                            overflow="hidden"
                        >
                            {/* ACTIONS */}
                            <Box position="absolute" top="12px" right="12px" zIndex={2}>
                                {/* 3 DOT */}
                                <Flex
                                    align="center"
                                    justify="center"
                                    w="32px"
                                    h="32px"
                                    rounded="md"
                                    cursor="pointer"
                                    bg="transparent"
                                    opacity={1}
                                    _groupHover={{ opacity: 0 }}
                                    transition="0.2s"
                                >
                                    <Text fontSize="xl" lineHeight="1">
                                        ⋮
                                    </Text>
                                </Flex>

                                {/* EDIT / DELETE */}
                                <Flex
                                    position="absolute"
                                    top="0"
                                    right="0"
                                    gap={1}
                                    opacity={0}
                                    _groupHover={{ opacity: 1 }}
                                    transition="0.2s"
                                    direction={"column"}
                                >
                                    <IconButton
                                        size="sm"
                                        aria-label="edit"
                                        icon={<EditIcon />}
                                        onClick={() => {
                                            setEditingItem(item);
                                            setName(item.name);
                                            setNote(item.note || "");
                                            setImagePreview(item.image ? IMAGE_URL + item.image : null);
                                            setImageFile(null);
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
                                    <IconButton
                                        size="sm"
                                        aria-label="delete"
                                        icon={<Move />}
                                        onClick={() => {
                                            setSelected(item);
                                            onSortOpen()
                                        }}
                                    />
                                </Flex>
                            </Box>

                            {/* CONTENT */}
                            <CardBody>
                                <Box pr="42px">
                                    <Box
                                        mb={3}
                                        w="100%"
                                        maxW="280px"
                                        h="120px"
                                        rounded="md"
                                        overflow="hidden"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        bg={
                                            item.image
                                                ? "transparent"
                                                : "linear-gradient(135deg, #667eea, #764ba2)"
                                        }
                                    >
                                        {item.image ? (
                                            <Image
                                                onClick={() => {
                                                    setDetailedImage(item.image);
                                                    detailedImageModal.onOpen();
                                                }}
                                                src={IMAGE_URL + item.image}
                                                alt={item.name}
                                                objectFit="cover"
                                                w="100%"
                                                h="100%"
                                                cursor="pointer"
                                            />
                                        ) : (
                                            <Text
                                                fontSize="sm"
                                                color="whiteAlpha.900"
                                                fontWeight="500"
                                                textAlign="center"
                                                px={2}
                                            >
                                                Rasm yuklanmagan
                                            </Text>
                                        )}
                                    </Box>
                                    <Text fontWeight="600" mb={1}>
                                        {item.name}
                                    </Text>

                                    {item.note && (
                                        <Text fontSize="sm" color="neutral.500">
                                            {item.note}
                                        </Text>
                                    )}
                                </Box>
                            </CardBody>
                            <Box
                                position='absolute'
                                bottom='12px'
                                right='12px'
                                zIndex={2}

                            >
                                <Badge
                                    display={'flex'}
                                    alignItems={'center'}
                                    justifyContent={'center'}
                                    colorScheme="blue"
                                    borderRadius={"50%"}
                                    w='30px'
                                    h='30px'
                                    p={"10px"}
                                >
                                    {item.sort ? item.sort : "?"}
                                </Badge>
                            </Box>
                        </Card>

                    ))}
                </SimpleGrid>
            )}

            {/* -------------------- CREATE / EDIT MODAL -------------------- */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {editingItem ? "Category tahrirlash" : "Category yaratish"}
                    </ModalHeader>
                    <ModalBody>
                        <Input
                            placeholder="Nomi"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            mb={3}
                        />

                        <Textarea
                            placeholder="Izoh"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            mb={3}
                        />

                        <Input type="file" accept="image/*" onChange={handleImageChange} />

                        {imagePreview && (
                            <Image
                                src={imagePreview}
                                alt="preview"
                                mt={3}
                                rounded="md"
                                maxH="200px"
                                objectFit="cover"
                            />
                        )}
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

            <Modal isOpen={detailedImageModal.isOpen} onClose={detailedImageModal.onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <Flex maxW={"92vw"} maxH={"92vh"} alignItems={"center"} justifyContent={"center"} boxSizing="border-box">
                        <Image maxW={"92vw"} maxH={"92vh"} src={IMAGE_URL + detailedImage} />
                    </Flex>
                </ModalContent>
            </Modal>

            {/* SORT INDEX TANLASH MODAL */}
            <Modal isOpen={isSortOpen} onClose={onSortClose} isCentered size="6xl">
                <ModalOverlay backdropFilter="blur(6px)" />
                <ModalContent
                    bg={modalBg}
                    maxW={{ base: "95vw", md: "85vw", xl: "75vw" }}
                    h={{ base: "90vh", md: "85vh" }}
                    borderRadius="2xl"
                    boxShadow="2xl"
                >
                    <ModalHeader fontSize="xl" fontWeight="semibold">
                        {selected?.name} - kategoriyasi uchun yani raqam tanlang
                    </ModalHeader>

                    <ModalCloseButton />

                    <ModalBody overflowY="auto">
                        <Grid
                            templateColumns={{
                                base: "repeat(auto-fill, minmax(60px, 1fr))",
                                md: "repeat(auto-fill, minmax(70px, 1fr))",
                            }}
                            gap={4}
                        >
                            {Array.from({ length: COUNT }, (_, i) => (
                                <Button
                                    key={i}
                                    h="60px"
                                    borderRadius="xl"
                                    fontWeight="600"
                                    fontSize="md"
                                    transition="all 0.2s ease"
                                    bg={
                                        +selected?.sort === i + 1
                                            ? "blue.500"
                                            : borderColor
                                    }
                                    color={selected === i + 1 ? "white" : "inherit"}
                                    _hover={{
                                        transform: "translateY(-2px)",
                                        shadow: "md",
                                    }}
                                    onClick={() => handleIndexNumber(i + 1)}
                                >
                                    {(+selected?.sort === i + 1 && indexing) ? <Spinner /> : i + 1}
                                </Button>
                            ))}
                        </Grid>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}
