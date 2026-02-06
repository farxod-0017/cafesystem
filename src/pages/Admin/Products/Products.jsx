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
    HStack,
} from "@chakra-ui/react";
import { EditIcon, AddIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Trash2 } from "lucide-react";

import useDebounce from "/src/hooks/useDebounce";
import { CAFE_UNITS } from "/src/constants/units";
import ConfirmDelModal from "../../../components/common/ConfirmDelModal";
import { apiProducts } from "../../../utils/Controllers/apiProducts";
import { apiLocations } from "../../../utils/Controllers/apiLocations";
import { toastService } from "../../../utils/toast";
import { UNITS } from "../../../constants/units";

export default function Products() {
    const cardBg = useColorModeValue("surface", "surface");
    const [searchParams, setSearchParams] = useSearchParams();

    // ---------------- FILTER STATE (URL) ----------------
    const [filters, setFilters] = useState(() => ({
        search: searchParams.get("search") || "all",
        locationId: searchParams.get("locationId") || "all",
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
    const [formLoading, setFormLoading] = useState(false);
    const [delLoading, setDelLoading] = useState(false);
    const [locations, setLocations] = useState([]);

    // ---------------- MODALS ----------------
    const { isOpen, onOpen, onClose } = useDisclosure();
    const confirmDelModal = useDisclosure();
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);

    // ---------------- FORM ----------------
    const [form, setForm] = useState({
        name: "",
        unit: "",
        locationId: "",
    });

    // UNITS
    const isCafe = locations.find((loc) => loc.id === filters.locationId)?.isCafe;
    const PAGE_UNITS =  isCafe ? CAFE_UNITS : UNITS;


    // ---------------- FETCH LOCATIONS ----------------
    useEffect(() => {
        apiLocations.getWarehouses().then((res) => {
            setLocations(res.data);
            updateFilter("locationId", res.data[0]?.id);
        });
    }, []);

    // ---------------- FETCH PRODUCTS ----------------
    const fetchProducts = async () => {
        if (filters.locationId === "all") return;
        setLoading(true);
        try {
            const res = await apiProducts.getFilteredProducts(
                filters.locationId,
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
            locationId: searchParams.get("locationId") || "all",
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
            unit: "",
            locationId: "",
        });
        setEditingItem(null);
    };

    const saveForm = async () => {
        if (!form.name || !form.unit) {
            toastService.error("Iltimos, zarur maydonlarni to'ldiring");
            return;
        }
        if (editingItem) {
            setFormLoading(true);
            try {
                const { locationId, ...data } = form;
                await apiProducts.Update(data, editingItem.id);
            }
            finally {
                setFormLoading(false);
            }
        } else {
            const data = { ...form, locationId: filters.locationId };
            if (!data.locationId) return;
            try {
                setFormLoading(true);
                await apiProducts.Add(data);
            }
            finally {
                setFormLoading(false);
            }
        }
        fetchProducts();
        onClose();
    };

    const deleteItem = async () => {
        setDelLoading(true);
        try {
            await apiProducts.Delete(deletingItem.id);
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
            {/* Location selector */}
            <Flex mb={4} gap={"16px"}>
                {locations?.map((location) => (
                    <Button
                        key={location.id}
                        variant={filters.locationId === location.id ? "solidPrimary" : "outlinePrimary"}
                        onClick={() => updateFilter("locationId", location.id)}
                    >
                        {location.name}
                    </Button>
                ))}
            </Flex>
            {/* FILTERS */}
            <HStack mb={4} spacing={3} flexWrap="wrap">
                <Input
                    placeholder="Qidirish..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    maxW="240px"
                />
                {/* <Select
                    value={filters.locationId}
                    onChange={(e) => updateFilter("locationId", e.target.value)}
                    maxW="200px"
                >
                    <option value="all">Barcha kategoriyalar</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </Select> */}
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
                            <IconButton
                                icon={<EditIcon />}
                                colorScheme="blue"
                                size="sm"
                                position="absolute"
                                top="10px"
                                right="50px"
                                onClick={() => {
                                    setEditingItem(item);
                                    setForm({
                                        name: item.name,
                                        unit: item.unit,
                                        locationId: item.locationId,
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
                                onClick={() => {
                                    setDeletingItem(item);
                                    confirmDelModal.onOpen();
                                }}
                            />
                            <CardBody>
                                <Text fontWeight="600">{item.name}</Text>
                                <Text >{item.unit}</Text>
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

                        <Select value={form.unit}
                            onChange={(e) => setForm({ ...form, unit: e.target.value })} mb={3}>
                            <option value="">O'lchov birligi</option>
                            {PAGE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </Select>

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

        </Box>
    );
}
