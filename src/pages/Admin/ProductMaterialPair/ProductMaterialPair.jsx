import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Flex,
    Text,
    IconButton,
    Button,
    Image,
    Badge,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    VStack,
    HStack,
    Skeleton,
    SkeletonText,
    SkeletonCircle,
    useDisclosure,
    useToast,
    Divider,
    Card,
    CardBody,
    Stack,
    Heading,
    SimpleGrid,
    CloseButton,
    Checkbox,
    Spinner,
    Center,
    Icon,
} from '@chakra-ui/react';
import {
    ChevronLeftIcon,
    SearchIcon,
    CloseIcon,
    AddIcon,
    DeleteIcon,
    EditIcon,
    CheckIcon,
} from '@chakra-ui/icons';
import { apiMenuProducts } from '../../../utils/Controllers/apiMenuProducts';
import { apiProductMaterialPairs } from '../../../utils/Controllers/apiProductMaterialPairs';
import { apiProducts } from '../../../utils/Controllers/apiProducts';
import { IMAGE_URL } from '../../../constants/imageUrl';

// Debounce hook
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

const ProductMaterialsPage = () => {
    const { cafeId, menuProductId } = useParams();
    // const param = useParams()
    // console.log(param);

    const navigate = useNavigate();
    const toast = useToast();

    // Product details state
    const [productDetails, setProductDetails] = useState(null);
    const [productLoading, setProductLoading] = useState(true);

    // Material pairs state
    const [materialPairs, setMaterialPairs] = useState([]);
    const [pairsLoading, setPairsLoading] = useState(true);

    // Edit state
    const [editingPairId, setEditingPairId] = useState(null);
    const [editCount, setEditCount] = useState('');

    // Delete modal state
    const [deletingPair, setDeletingPair] = useState(null);
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const [deleting, setDeleting] = useState(false);

    // Add materials drawer state
    const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [materials, setMaterials] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [materialsLoading, setMaterialsLoading] = useState(false);
    const [selectedMaterials, setSelectedMaterials] = useState({});
    const [savingMaterials, setSavingMaterials] = useState(false);

    const debouncedSearch = useDebounce(searchText, 300);

    // Fetch product details
    const fetchProductDetails = async () => {
        setProductLoading(true);
        try {
            const response = await apiMenuProducts.getDetails(menuProductId);
            setProductDetails(response.data);
        } finally {
            setProductLoading(false);
        }
    };

    // Fetch material pairs
    const fetchMaterialPairs = async () => {
        setPairsLoading(true);
        try {
            const response = await apiProductMaterialPairs.getByProductId(menuProductId);
            setMaterialPairs(response.data || []);
        } finally {
            setPairsLoading(false);
        }
    };

    // Fetch materials for drawer
    const fetchMaterials = async () => {
        setMaterialsLoading(true);
        try {
            const response = await apiProducts.getFilteredProducts(
                cafeId,
                debouncedSearch,
                currentPage,
                20
            );
            setMaterials(response.data?.data?.records || []);
            setPagination(response.data?.data?.pagination || null);
        } finally {
            setMaterialsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchProductDetails();
        fetchMaterialPairs();
    }, [menuProductId]);

    // Load materials when drawer opens or search/page changes
    useEffect(() => {
        if (isDrawerOpen) {
            fetchMaterials();
        }
    }, [debouncedSearch, currentPage, isDrawerOpen]);

    // Reset search and page when search text changes
    useEffect(() => {
        if (debouncedSearch !== searchText) {
            setCurrentPage(1);
        }
    }, [debouncedSearch]);

    // Get already linked material IDs
    const linkedMaterialIds = useMemo(() => {
        return new Set(materialPairs.map(pair => pair.materialId));
    }, [materialPairs]);

    // Handle edit count
    const handleStartEdit = (pairId, currentCount) => {
        setEditingPairId(pairId);
        setEditCount(currentCount.toString());
    };

    const handleSaveEdit = async (pair) => {
        if (!editCount || parseFloat(editCount) <= 0) {
            toast({
                title: 'Xatolik',
                description: 'Miqdor 0 dan katta bo\'lishi kerak',
                status: 'error',
                duration: 3000,
            });
            return;
        }

        try {
            const data = {
                productId: menuProductId,
                materialId: pair.materialId,
                count: parseFloat(editCount),
            };
            await apiProductMaterialPairs.Update(data, pair.id);
            await fetchMaterialPairs();
            setEditingPairId(null);
            setEditCount('');
        } catch (error) {
            console.error('Edit error:', error);
        }
    };

    const handleCancelEdit = () => {
        setEditingPairId(null);
        setEditCount('');
    };

    // Handle delete
    const handleDeleteClick = (pair) => {
        setDeletingPair(pair);
        onDeleteOpen();
    };

    const handleConfirmDelete = async () => {
        try {
            setDeleting(true);
            await apiProductMaterialPairs.Delete(deletingPair.id);
            await fetchMaterialPairs();
            onDeleteClose();
            setDeletingPair(null);
        } finally{
            setDeleting(false);
        }
    };

    // Handle material selection in drawer
    const handleMaterialSelect = (material) => {
        const isLinked = linkedMaterialIds.has(material.id);
        const isAlreadySelected = selectedMaterials[material.id];

        if (isLinked) return; // Can't select already linked materials

        if (isAlreadySelected) {
            // Remove from selection
            const newSelected = { ...selectedMaterials };
            delete newSelected[material.id];
            setSelectedMaterials(newSelected);
        } else {
            // Add to selection
            setSelectedMaterials({
                ...selectedMaterials,
                [material.id]: {
                    material,
                    count: '',
                },
            });
        }
    };

    const handleCountChange = (materialId, count) => {
        setSelectedMaterials({
            ...selectedMaterials,
            [materialId]: {
                ...selectedMaterials[materialId],
                count,
            },
        });
    };

    const handleRemoveSelected = (materialId) => {
        const newSelected = { ...selectedMaterials };
        delete newSelected[materialId];
        setSelectedMaterials(newSelected);
    };

    const handleSaveMaterials = async () => {
        // Validate
        const selectedArray = Object.values(selectedMaterials);
        if (selectedArray.length === 0) {
            toast({
                title: 'Xatolik',
                description: 'Hech qanday xomashyo tanlanmagan',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        const invalidItems = selectedArray.filter(item => !item.count || parseFloat(item.count) <= 0);
        if (invalidItems.length > 0) {
            toast({
                title: 'Xatolik',
                description: 'Barcha xomashyolar uchun miqdor kiriting',
                status: 'error',
                duration: 3000,
            });
            return;
        }

        setSavingMaterials(true);
        try {
            const payload = {
                list: selectedArray.map(item => ({
                    productId: menuProductId,
                    materialId: item.material.id,
                    count: parseFloat(item.count),
                })),
            };

            await apiProductMaterialPairs.AddList(payload);
            await fetchMaterialPairs();
            setSelectedMaterials({});
            setSearchText('');
            setCurrentPage(1);
            onDrawerClose();
        } catch (error) {
            console.error('Save materials error:', error);
        } finally {
            setSavingMaterials(false);
        }
    };

    return (
        <Box minH="100vh" bg="bg">
            {/* Header */}
            <Box bg="surfBlur" backdropFilter={"blur(7px)"} borderBottom="1px" borderColor="border" position="sticky" top={0} zIndex={10}>
                <Container maxW="container.xl" py={4}>
                    <HStack spacing={4}>
                        <IconButton
                            icon={<ChevronLeftIcon boxSize={6} />}
                            onClick={() => navigate(-1)}
                            variant="ghost"
                            aria-label="Orqaga"
                            size="lg"
                        />
                        <VStack align="start" spacing={0} flex={1}>
                            <Heading size="md">Mahsulot xomashyolari</Heading>
                            {productLoading ? (
                                <SkeletonText noOfLines={1} width="150px" mt={1} />
                            ) : (
                                <Text fontSize="sm" color="gray.600">
                                    {productDetails?.name}
                                </Text>
                            )}
                        </VStack>
                    </HStack>
                </Container>
            </Box>

            <Container maxW="container.xl" py={6}>
                {/* Product Details Card */}
                {productLoading ? (
                    <Card mb={6} bg={"surface"}>
                        <CardBody>
                            <HStack spacing={4}>
                                <SkeletonCircle size="20" />
                                <VStack align="start" flex={1} spacing={2}>
                                    <SkeletonText noOfLines={2} width="200px" />
                                </VStack>
                            </HStack>
                        </CardBody>
                    </Card>
                ) : productDetails ? (
                    <Card mb={6} bg="surface" shadow="sm">
                        <CardBody>
                            <HStack spacing={4} align="start">
                                {productDetails.image && (
                                    <Image
                                        src={IMAGE_URL + productDetails.image}
                                        alt={productDetails.name}
                                        boxSize="80px"
                                        objectFit="cover"
                                        borderRadius="lg"
                                    />
                                )}
                                <VStack align="start" flex={1} spacing={1}>
                                    <Heading size="md">{productDetails.name}</Heading>
                                    <HStack>
                                        <Badge colorScheme="green" fontSize="sm">
                                            {parseFloat(productDetails.price).toLocaleString()} so'm
                                        </Badge>
                                        <Badge colorScheme="blue" fontSize="sm">
                                            {productDetails.unit}
                                        </Badge>
                                    </HStack>
                                    {productDetails.note && (
                                        <Text fontSize="sm" color="gray.600">
                                            {productDetails.note}
                                        </Text>
                                    )}
                                    <Badge colorScheme="purple" fontSize="sm" mt={2}>
                                        ✓ {materialPairs.length} ta xomashyo biriktirilgan
                                    </Badge>
                                </VStack>
                            </HStack>
                        </CardBody>
                    </Card>
                ) : null}

                {/* Material Pairs List */}
                <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                        <Heading size="sm">Biriktirilgan xomashyolar</Heading>
                        <Button
                            leftIcon={<AddIcon />}
                            colorScheme="blue"
                            size="sm"
                            onClick={onDrawerOpen}
                        >
                            Xomashyo qo'shish
                        </Button>
                    </HStack>

                    {pairsLoading ? (
                        // Skeleton loading
                        <Stack spacing={3}>
                            {[1, 2, 3].map((i) => (
                                <Card key={i}>
                                    <CardBody>
                                        <HStack justify="space-between">
                                            <SkeletonText noOfLines={2} width="200px" />
                                            <SkeletonText noOfLines={1} width="80px" />
                                        </HStack>
                                    </CardBody>
                                </Card>
                            ))}
                        </Stack>
                    ) : materialPairs.length === 0 ? (
                        // Empty state
                        <Card bg={"surface"}>
                            <CardBody>
                                <VStack spacing={4} py={8}>
                                    <Icon viewBox="0 0 24 24" boxSize={16} color="gray.300">
                                        <path
                                            fill="currentColor"
                                            d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"
                                        />
                                    </Icon>
                                    <VStack spacing={2}>
                                        <Text fontSize="lg" fontWeight="medium" color="text">
                                            Hozircha xomashyo biriktirilmagan
                                        </Text>
                                        <Text fontSize="sm" color="gray.500">
                                            Mahsulotga xomashyo qo'shish uchun yuqoridagi tugmani bosing
                                        </Text>
                                    </VStack>
                                    <Button
                                        leftIcon={<AddIcon />}
                                        colorScheme="blue"
                                        onClick={onDrawerOpen}
                                    >
                                        Xomashyo qo'shish
                                    </Button>
                                </VStack>
                            </CardBody>
                        </Card>
                    ) : (
                        // Material pairs list
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            {materialPairs.map((pair) => (
                                <Card key={pair.id} bg="surface" shadow="sm" _hover={{ shadow: 'md' }} transition="all 0.2s">
                                    <CardBody>
                                        <VStack align="stretch" spacing={3}>
                                            <HStack justify="space-between">
                                                <VStack align="start" spacing={1} flex={1}>
                                                    <Text fontWeight="semibold" fontSize="lg"
                                                        wordBreak="break-word"
                                                        overflowWrap="break-word"
                                                        whiteSpace="normal">
                                                        {pair.material?.name}
                                                    </Text>
                                                    <Badge colorScheme="gray" fontSize="xs">
                                                        {pair.material?.unit}
                                                    </Badge>
                                                </VStack>
                                                <IconButton
                                                    icon={<DeleteIcon />}
                                                    colorScheme="red"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(pair)}
                                                    aria-label="O'chirish"
                                                />
                                            </HStack>

                                            <Divider />

                                            {editingPairId === pair.id ? (
                                                <HStack>
                                                    <Input
                                                        type="number"
                                                        value={editCount}
                                                        onChange={(e) => setEditCount(e.target.value)}
                                                        size="sm"
                                                        autoFocus
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleSaveEdit(pair);
                                                            }
                                                        }}
                                                    />
                                                    <IconButton
                                                        icon={<CheckIcon />}
                                                        colorScheme="green"
                                                        size="sm"
                                                        onClick={() => handleSaveEdit(pair)}
                                                        aria-label="Saqlash"
                                                    />
                                                    <IconButton
                                                        icon={<CloseIcon />}
                                                        colorScheme="gray"
                                                        size="sm"
                                                        onClick={handleCancelEdit}
                                                        aria-label="Bekor qilish"
                                                    />
                                                </HStack>
                                            ) : (
                                                <HStack justify="space-between">
                                                    <HStack spacing={2}>
                                                        <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                                                            {pair.count}
                                                        </Text>
                                                        <Text fontSize="sm" color="gray.600">
                                                            {pair.material?.unit}
                                                        </Text>
                                                    </HStack>
                                                    <IconButton
                                                        icon={<EditIcon />}
                                                        colorScheme="blue"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleStartEdit(pair.id, pair.count)}
                                                        aria-label="Tahrirlash"
                                                    />
                                                </HStack>
                                            )}
                                        </VStack>
                                    </CardBody>
                                </Card>
                            ))}
                        </SimpleGrid>
                    )}
                </VStack>
            </Container>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Xomashyoni o'chirish</ModalHeader>
                    <ModalBody>
                        {deletingPair && (
                            <VStack align="start" spacing={3}>
                                <Text>Quyidagi xomashyoni mahsulotdan o'chirmoqchimisiz?</Text>
                                <Card bg="surface" width="100%">
                                    <CardBody>
                                        <VStack align="start" spacing={2}>
                                            <Text fontWeight="semibold" fontSize="lg" 
                                                wordBreak="break-word"
                                                overflowWrap="break-word"
                                                whiteSpace="normal">
                                                {deletingPair.material?.name}
                                            </Text>
                                            <HStack>
                                                <Badge colorScheme="blue">
                                                    {deletingPair.count} {deletingPair.material?.unit}
                                                </Badge>
                                            </HStack>
                                        </VStack>
                                    </CardBody>
                                </Card>
                                <Text fontSize="sm" fontWeight={"600"} color="red.600">
                                    Bu amalni ortga qaytarib bo'lmaydi.
                                </Text>
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onDeleteClose}>
                            Bekor qilish
                        </Button>
                        <Button isLoading={deleting} loadingText="O'chirilmoqda..." colorScheme="red" onClick={handleConfirmDelete}>
                            Ha, o'chirish
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Add Materials Drawer */}
            <Drawer isOpen={isDrawerOpen} placement="right" onClose={onDrawerClose} size="lg">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader borderBottomWidth="1px" >Xomashyo qo'shish</DrawerHeader>

                    <DrawerBody>
                        <VStack spacing={4} align="stretch">
                            {/* Search */}
                            <InputGroup>
                                <InputLeftElement pointerEvents="none">
                                    <SearchIcon color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Xomashyo qidirish..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                                {searchText && (
                                    <InputRightElement>
                                        <IconButton
                                            icon={<CloseIcon />}
                                            size="xs"
                                            variant="ghost"
                                            onClick={() => setSearchText('')}
                                            aria-label="Tozalash"
                                        />
                                    </InputRightElement>
                                )}
                            </InputGroup>

                            {/* Selected Materials */}
                            {Object.keys(selectedMaterials).length > 0 && (
                                <Card bg={"surface"} borderColor="blue.200" borderWidth="1px">
                                    <CardBody>
                                        <VStack align="stretch" spacing={3}>
                                            <Text fontWeight="semibold">
                                                Tanlangan xomashyolar ({Object.keys(selectedMaterials).length})
                                            </Text>
                                            {Object.values(selectedMaterials).map(({ material, count }) => (
                                                <HStack key={material.id} bg="bg" p={2} borderRadius="md">
                                                    <VStack align="start" spacing={0} flex={1}>
                                                        <Text fontSize="sm" fontWeight="medium">
                                                            {material.name}
                                                        </Text>
                                                        <Text fontSize="xs" color="text">
                                                            {material.unit}
                                                        </Text>
                                                    </VStack>
                                                    <Input
                                                        type="number"
                                                        placeholder="Miqdor"
                                                        value={count}
                                                        onChange={(e) => handleCountChange(material.id, e.target.value)}
                                                        size="sm"
                                                        width="100px"
                                                    />
                                                    <CloseButton
                                                        size="sm"
                                                        onClick={() => handleRemoveSelected(material.id)}
                                                    />
                                                </HStack>
                                            ))}
                                        </VStack>
                                    </CardBody>
                                </Card>
                            )}

                            <Divider />

                            {/* Materials List */}
                            {materialsLoading ? (
                                <Stack spacing={3}>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <HStack key={i} p={3} borderWidth="1px" borderRadius="md">
                                            <SkeletonCircle size="6" />
                                            <SkeletonText noOfLines={2} flex={1} />
                                        </HStack>
                                    ))}
                                </Stack>
                            ) : materials.length === 0 ? (
                                <Center py={10}>
                                    <VStack spacing={3}>
                                        <Icon viewBox="0 0 24 24" boxSize={12} color="gray.300">
                                            <path
                                                fill="currentColor"
                                                d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"
                                            />
                                        </Icon>
                                        <Text color="gray.500">Xomashyo topilmadi</Text>
                                    </VStack>
                                </Center>
                            ) : (
                                <VStack align="stretch" spacing={2}>
                                    {materials.map((material) => {
                                        const isLinked = linkedMaterialIds.has(material.id);
                                        const isSelected = selectedMaterials[material.id];

                                        return (
                                            <Card
                                                key={material.id}
                                                bg={isSelected ? 'secondary' : 'surface'}
                                                borderColor={isSelected ? 'blue.300' : 'gray.200'}
                                                borderWidth="1px"
                                                opacity={isLinked ? 0.5 : 1}
                                                cursor={isLinked ? 'not-allowed' : 'pointer'}
                                                onClick={() => !isLinked && handleMaterialSelect(material)}
                                                _hover={!isLinked ? { shadow: 'md' } : {}}
                                                transition="all 0.2s"
                                            >
                                                <CardBody p={3}>
                                                    <HStack>
                                                        <Checkbox
                                                            isChecked={isSelected || isLinked}
                                                            isDisabled={isLinked}
                                                            onChange={() => handleMaterialSelect(material)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <VStack  align="start" spacing={0} flex={1}>
                                                            <Text color={"white"} fontWeight="medium">{material.name}</Text>
                                                            <HStack spacing={2}>
                                                                <Badge colorScheme="gray" fontSize="xs">
                                                                    {material.unit}
                                                                </Badge>
                                                                {isLinked && (
                                                                    <Badge colorScheme="green" fontSize="xs">
                                                                        ✓ Ulangan
                                                                    </Badge>
                                                                )}
                                                            </HStack>
                                                        </VStack>
                                                    </HStack>
                                                </CardBody>
                                            </Card>
                                        );
                                    })}
                                </VStack>
                            )}

                            {/* Pagination */}
                            {pagination && pagination.total_pages > 1 && (
                                <HStack justify="center" pt={4}>
                                    <Button
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        isDisabled={!pagination.hasPrev}
                                    >
                                        Oldingi
                                    </Button>
                                    <Text fontSize="sm">
                                        {currentPage} / {pagination.total_pages}
                                    </Text>
                                    <Button
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => p + 1)}
                                        isDisabled={!pagination.hasNext}
                                    >
                                        Keyingi
                                    </Button>
                                </HStack>
                            )}
                        </VStack>
                    </DrawerBody>

                    <DrawerFooter borderTopWidth="1px">
                        <Button variant="outline" mr={3} onClick={onDrawerClose}>
                            Bekor qilish
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={handleSaveMaterials}
                            isLoading={savingMaterials}
                            isDisabled={Object.keys(selectedMaterials).length === 0}
                        >
                            Saqlash ({Object.keys(selectedMaterials).length})
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </Box>
    );
};

export default ProductMaterialsPage;