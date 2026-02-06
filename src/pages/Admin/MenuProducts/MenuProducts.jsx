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
    HStack,
} from "@chakra-ui/react";
import { EditIcon, AddIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Trash2 } from "lucide-react";

import useDebounce from "/src/hooks/useDebounce";
import { CAFE_UNITS } from "/src/constants/units";
import { apiMenuProducts } from "../../../utils/Controllers/apiMenuProducts";
import { apiCategories } from "../../../utils/Controllers/apiCategories";
import { IMAGE_URL } from "../../../constants/imageUrl";
import ConfirmDelModal from "../../../components/common/ConfirmDelModal";
import { toastService } from "../../../utils/toast";
import { apiLocations } from "../../../utils/Controllers/apiLocations";

export default function MenuProducts() {
    const cardBg = useColorModeValue("surface", "surface");
    const [searchParams, setSearchParams] = useSearchParams();
    const detailedImageModal = useDisclosure();
    const [detailedImage, setDetailedImage] = useState(null);
    const navigate = useNavigate();
    const [cafeId, setCafeId] = useState(null);
    // ---------------- FILTER STATE (URL) ----------------
    const [filters, setFilters] = useState(() => ({
        search: searchParams.get("search") || "all",
        categoryId: searchParams.get("categoryId") || "all",
        page: Number(searchParams.get("page")) || 1,
        limit: Number(searchParams.get("limit")) || 20,
    }));

    // ---------------- SEARCH (LOCAL + DEBOUNCE) ----------------
    const [searchValue, setSearchValue] = useState(
        filters.search === "all" ? "" : filters.search
    );
    const debouncedSearch = useDebounce(searchValue, 500);

    // ---------------- DATA ----------------
    const [items, setItems] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [delLoading, setDelLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    // ---------------- MODALS ----------------
    const { isOpen, onOpen, onClose } = useDisclosure();
    const confirmDelModal = useDisclosure();
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);

    // ---------------- FORM ----------------
    const [form, setForm] = useState({
        name: "",
        price: "",
        unit: "",
        categoryId: "",
        note: "",
        image: null,
        imagePreview: null,
    });

    // ---------------- FETCH CATEGORIES ----------------
    useEffect(() => {
        apiCategories.All().then((res) => {
            setCategories(res.data.categories);
        });
    }, []);

    // -------------FETCH Warehouse for CAFE ID (for future use)----------------
    const fetchWarehouse = async () => {
        try {
            const res = await apiLocations.getWarehouses();
            const cafeWarehouse = res.data.find(w => w.isCafe === true);
            if(cafeWarehouse) setCafeId(cafeWarehouse.id);
        } finally { }
    };
    useEffect(() => {
       fetchWarehouse();
    }, [])

    // ---------------- FETCH PRODUCTS ----------------

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await apiMenuProducts.getFilteredProducts(
                filters.categoryId,
                filters.search,
                filters.page,
                filters.limit
            );
            setItems(res.data.data?.records || []);
            setTotalPages(res.data.data?.pagination?.total_pages || 1);
        } finally {
            setLoading(false);
        }
    };

    // ---------------- DEBOUNCED SEARCH ----------------
    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            search: debouncedSearch?.trim() || "all",
            page: 1,
        }));
    }, [debouncedSearch]);

    // ---------------- FILTER → API + URL ----------------
    useEffect(() => {
        fetchProducts();
        setSearchParams(filters);
    }, [filters]);

    // ---------------- URL → STATE (BACK / RELOAD) ----------------
    useEffect(() => {
        const s = searchParams.get("search") || "all";
        setFilters({
            search: s,
            categoryId: searchParams.get("categoryId") || "all",
            page: Number(searchParams.get("page")) || 1,
            limit: Number(searchParams.get("limit")) || 20,
        });
        setSearchValue(s === "all" ? "" : s);
    }, [searchParams]);

    // ---------------- FILTER CHANGE ----------------
    const updateFilter = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: key === "page" ? value : 1,
        }));
    };

    // ---------------- FORM HELPERS ----------------
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
        if (!form.name || !form.price || !form.unit || !form.categoryId) {
            toastService.error("Iltimos, zarur maydonlarni to'ldiring");
            return;
        }
        const data = new FormData();
        const { imagePreview, ...rest } = form;
        for (const k in rest) if (rest[k] !== null) data.append(k, rest[k]);

        if (editingItem) {
            setFormLoading(true);
            try {
                await apiMenuProducts.Update(data, editingItem.id);
            } finally {
                setFormLoading(false);
            }
        } else {
            try {
                setFormLoading(true);
                await apiMenuProducts.Add(data);
            } finally {
                setFormLoading(false);
            }
        }
        fetchProducts();
        onClose();
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
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    maxW="240px"
                />
                <Select
                    value={filters.categoryId}
                    onChange={(e) => updateFilter("categoryId", e.target.value)}
                    maxW="200px"
                >
                    <option value="all">Barcha kategoriyalar</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
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
                        <Card onClick={()=> {                            
                            if(cafeId) navigate(`/menu/${cafeId}/products/${item.id}`);
                        }} key={item.id} bg={cardBg} rounded="xl" position="relative" cursor={"pointer"}>
                            <IconButton
                                icon={<EditIcon />}
                                colorScheme="blue"
                                size="sm"
                                position="absolute"
                                top="10px"
                                right="50px"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingItem(item);
                                    setForm({
                                        name: item.name,
                                        price: item.price,
                                        unit: item.unit,
                                        categoryId: item.categoryId,
                                        note: item.note,
                                        image: null,
                                        imagePreview: IMAGE_URL + item.image,
                                    });
                                    onOpen();
                                }}
                            />
                            <IconButton
                                icon={<Trash2 size={16} />}
                                colorScheme="red"
                                size="sm"
                                position="absolute"
                                top="10px"
                                right="10px"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingItem(item);
                                    confirmDelModal.onOpen();
                                }}
                            />
                            <CardBody>
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
                                            onClick={(e) => {
                                                e.stopPropagation();
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
                    isDisabled={filters.page <= 1}
                    onClick={() => updateFilter("page", filters.page - 1)}
                >
                    Oldingi
                </Button>
                <Text>{filters.page} / {totalPages}</Text>
                <Button
                    size="sm"
                    isDisabled={filters.page >= totalPages}
                    onClick={() => updateFilter("page", filters.page + 1)}
                >
                    Keyingi
                </Button>
            </Flex>

            {/* ADD / EDIT MODAL */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {editingItem ? "Mahsulotni tahrirlash" : "Mahsulot qo‘shish"}
                    </ModalHeader>
                    <ModalBody>
                        <Input placeholder="Nomi" value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })} mb={3} />
                        <Input type="number" placeholder="Narxi" value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })} mb={3} />
                        <Select value={form.unit}
                            onChange={(e) => setForm({ ...form, unit: e.target.value })} mb={3}>
                            <option value="">O'lchov birligi</option>
                            {CAFE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </Select>
                        <Select value={form.categoryId}
                            onChange={(e) => setForm({ ...form, categoryId: e.target.value })} mb={3}>
                            <option color="text" value="">Kategoriya tanlang</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                        <Textarea placeholder="Izoh" value={form.note}
                            onChange={(e) => setForm({ ...form, note: e.target.value })} />
                        {form.imagePreview && (
                            <Image src={form.imagePreview} h="150px" w="100%" objectFit="cover" mt={3} />
                        )}
                        <Input type="file" accept="image/*" mt={3}
                            onChange={(e) => {
                                const f = e.target.files[0];
                                setForm({ ...form, image: f, imagePreview: URL.createObjectURL(f) });
                            }} />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>Bekor</Button>
                        <Button isLoading={formLoading} loadingText="Saqlanmoqda..." onClick={saveForm}>Saqlash</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <ConfirmDelModal
                isOpen={confirmDelModal.isOpen}
                onClose={confirmDelModal.onClose}
                onConfirm={deleteItem}
                itemName={deletingItem?.name}
                loading={delLoading}
                typeItem="mahsulot"
            />
            <Modal isOpen={detailedImageModal.isOpen} onClose={detailedImageModal.onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <Flex maxW={"92vw"} maxH={"92vh"} alignItems={"center"} justifyContent={"center"} boxSizing="border-box">
                        <Image maxW={"92vw"} maxH={"92vh"} src={IMAGE_URL + detailedImage} />
                    </Flex>
                </ModalContent>
            </Modal>
        </Box>
    );
}
