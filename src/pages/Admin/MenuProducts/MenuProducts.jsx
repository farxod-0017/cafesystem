// UPDATED PRODUCTS PAGE WITH PAGINATION + LIMIT + URL SYNC

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
    Skeleton,
    Select,
    Image,
    HStack
} from "@chakra-ui/react";
import { EditIcon, AddIcon } from "@chakra-ui/icons";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CAFE_UNITS } from "/src/constants/units";
import { apiMenuProducts } from "../../../utils/Controllers/apiMenuProducts";
import { apiCategories } from "../../../utils/Controllers/apiCategories";
import { IMAGE_URL } from "../../../constants/imageUrl";
import { Delete, DeleteIcon, Icon, Trash2, Trash2Icon } from "lucide-react";
import ConfirmDelModal from "../../../components/common/ConfirmDelModal";

// axios.get('/products', { params })
// apiProducts.getFilteredProducts(categoryId, search, page, limit)

export default function MenuProducts() {
    const cardBg = useColorModeValue("surface", "surface");
    const [searchParams, setSearchParams] = useSearchParams();

    // ---------------- FILTER STATE (URL SYNCED) ----------------
    const [filters, setFilters] = useState(() => ({
        search: searchParams.get("search") || "all",
        categoryId: searchParams.get("categoryId") || "all",
        page: Number(searchParams.get("page")) || 1,
        limit: Number(searchParams.get("limit")) || 20,
    }));

    // ---------------- DATA STATE ----------------
    const [items, setItems] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [delLoading, setDelLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    // ---------------- MODAL ----------------
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);
    const confirmDelModal = useDisclosure();

    // ---------------- FORM STATE (SINGLE OBJECT) ----------------
    const [form, setForm] = useState({
        name: "",
        price: "",
        unit: "",
        categoryId: "",
        note: "",
        image: null,
        imagePreview: null,
    });

    // -------------------- FETCH Categories --------------------
    const fetchCategories = async () => {
        try {
            const res = await apiCategories.All();
            setCategories(res.data.categories)
        } finally {
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);
    // ---------------- FETCH ----------------
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await apiMenuProducts.getFilteredProducts(
                filters.categoryId,
                filters.search,
                filters.page,
                filters.limit
            );

            // MOCK RESPONSE STRUCTURE
            //   const res = {
            //     data: {
            //       items: [],
            //       totalPages: 5,
            //     },
            //   };

            setItems(res.data.data?.records);
            setTotalPages(res.data.data?.pagination?.total_pages);
        } finally {
            setLoading(false);
        }
    };

    // ---------------- EFFECTS ----------------
    useEffect(() => {
        fetchProducts();
        setSearchParams(filters);
    }, [filters]);

    // ---------------- FILTER CHANGE ----------------
    const updateFilter = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: key !== "page" ? 1 : value,
        }));
    };

    // ---------------- RESET FORM ----------------
    const resetForm = () => {
        setForm({
            name: "",
            price: "",
            unit: "",
            categoryId: "",
            note: "",
            image: null,
            imagePreview: null,
        });
        setEditingItem(null);
    };

    const saveForm = async () => {
        try {
            if (editingItem) {
                // UPDATE
                const data = new FormData();
                const { imagePreview, ...rest } = form;
                if (!form.image) delete rest.image;

                for (const key in rest) {
                    data.append(key, rest[key]);
                }
                await apiMenuProducts.Update(data, editingItem.id);
            } else {
                // ADD
                const data = new FormData();
                const { imagePreview, ...rest } = form;
                for (const key in rest) {
                    data.append(key, rest[key]);
                }
                await apiMenuProducts.Add(data);
            }
            fetchProducts();
            onClose();
        } finally { }
    };
    const deleteItem = async () => {
        setDelLoading(true);
        try {
            await apiMenuProducts.Delete(deletingItem.id);
            fetchProducts();
            confirmDelModal.onClose();
        } finally {
            setDelLoading(false);
         }
    };

    // ---------------- RENDER ----------------
    return (
        <Box p={6}>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="md">Mahsulotlar</Heading>
                <Button leftIcon={<AddIcon />} onClick={() => { resetForm(); onOpen(); }}>
                    Yangi mahsulot
                </Button>
            </Flex>

            {/* FILTERS */}
            <HStack mb={4} spacing={3} flexWrap="wrap">
                <Input
                    placeholder="Qidirish..."
                    value={filters.search === "all" ? "" : filters.search}
                    onChange={(e) => updateFilter("search", e.target.value || "all")}
                    maxW="240px"
                />
                <Select
                    value={filters.categoryId}
                    onChange={(e) => updateFilter("categoryId", e.target.value)}
                    maxW="200px"
                >
                    {categories?.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </Select>

                <Select
                    value={filters.limit}
                    onChange={(e) => updateFilter("limit", Number(e.target.value))}
                    maxW="120px"
                >
                    {[10, 20, 50].map((l) => (
                        <option key={l} value={l}>{l} ta</option>
                    ))}
                </Select>

            </HStack>

            {/* LIST */}
            {loading ? (
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    {[1, 2, 3].map((i) => <Skeleton key={i} h="220px" rounded="xl" />)}
                </SimpleGrid>
            ) : items.length === 0 ? (
                <Text color="neutral.500">Mahsulotlar topilmadi</Text>
            ) : (
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    {items.map((item) => (
                        <Card key={item.id} bg={cardBg} rounded="xl" position="relative">
                            <Flex>
                                <IconButton
                                    icon={<EditIcon />}
                                    size="sm"
                                    position="absolute"
                                    top="10px"
                                    right="50px"
                                    onClick={() => {
                                        setEditingItem(item);
                                        setForm({ name: item.name, price: item.price, unit: item.unit, categoryId: item.categoryId, note: item.note, image: null, imagePreview: IMAGE_URL + item.image });
                                        onOpen();
                                    }}
                                />
                                <IconButton
                                    icon={<Trash2 size={16} />}
                                    size="sm"
                                    position="absolute"
                                    top="10px"
                                    right="10px"
                                    onClick={() => {
                                        setDeletingItem(item);
                                        confirmDelModal.onOpen();
                                    }}
                                />
                            </Flex>


                            <CardBody>
                                <Image
                                    src={IMAGE_URL + item.image}
                                    alt={item.name}
                                    rounded="md"
                                    mb={3}
                                    h="120px"
                                    w="100%"
                                    objectFit="cover"
                                />
                                <Text fontWeight="600">{item.name}</Text>
                                <Text fontSize="sm" color="neutral.500">
                                    {item.price} / {item.unit}
                                </Text>
                            </CardBody>
                        </Card>
                    ))}
                </SimpleGrid>
            )}

            {/* PAGINATION */}
            <Flex justify="center" mt={6} gap={2}>
                <Button
                    size="sm"
                    onClick={() => updateFilter("page", filters.page - 1)}
                    isDisabled={filters.page <= 1}
                >
                    Oldingi
                </Button>
                <Text alignSelf="center">
                    {filters.page} / {totalPages}
                </Text>
                <Button
                    size="sm"
                    onClick={() => updateFilter("page", filters.page + 1)}
                    isDisabled={filters.page >= totalPages}
                >
                    Keyingi
                </Button>
            </Flex>

            {/* MODAL (ADD / EDIT) */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {editingItem ? "Mahsulotni tahrirlash" : "Mahsulot qo‘shish"}
                    </ModalHeader>
                    <ModalBody>
                        <Input
                            placeholder="Nomi"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            mb={3}
                        />
                        <Input
                            type="number"
                            placeholder="Narxi"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            mb={3}
                        />
                        <Select
                            placeholder="Birlik"
                            value={form.unit}
                            onChange={(e) => setForm({ ...form, unit: e.target.value })}
                            mb={3}
                        >
                            {CAFE_UNITS.map((u) => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </Select>
                        <Select
                            placeholder="Kategoriasi"
                            value={form.categoryId}
                            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                            mb={3}
                        >
                            {categories?.map((c) => (
                                <option key={c.id} value={c.id} >{c.name}</option>
                            ))}
                        </Select>
                        <Textarea
                            placeholder="Izoh"
                            value={form.note}
                            onChange={(e) => setForm({ ...form, note: e.target.value })}
                        />
                        <Image
                            src={form.imagePreview}
                            alt="Preview"
                            rounded="md"
                            mb={3}
                            mt={3}
                            h="150px"
                            w="100%"
                            objectFit="cover"
                        />
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                setForm({
                                    ...form,
                                    image: file,
                                    imagePreview: URL.createObjectURL(file),
                                });
                            }}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>Bekor</Button>
                        <Button onClick={() => saveForm()}>Saqlash</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            <ConfirmDelModal isOpen={confirmDelModal.isOpen} onClose={confirmDelModal.onClose} onConfirm={deleteItem} itemName={deletingItem?.name} loading={delLoading} typeItem={"mahsulot"}/>
        </Box>
    );
}
