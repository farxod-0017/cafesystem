import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Flex,
    Heading,
    Text,
    Button,
    Input,
    Select,
    Textarea,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    IconButton,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    FormControl,
    FormLabel,
    InputGroup,
    InputLeftElement,
    useDisclosure,
    useToast,
    Spinner,
    Badge,
    HStack,
    VStack,
    Divider,
    Card,
    CardBody,
    NumberInput,
    NumberInputField,
    Stack
} from '@chakra-ui/react';
import {
    Search, Plus, Edit2, Trash2, DollarSign,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { apiLocations } from '../../../utils/Controllers/apiLocations';
import { apiPayMethods } from '../../../utils/Controllers/apiPayMethods';
import { apiCashs } from '../../../utils/Controllers/apiCashs';
import { apiLocationPayment } from '../../../utils/Controllers/apiLocationPayment';
import Cookies from 'js-cookie';
import { useWarehouseStore } from '../../../store/useWarehouseStore';
// import { set } from 'react-datepicker/dist/dist/date_utils.js';

const TaminotchilarPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { mainWarehouseId } = useWarehouseStore()
    const userId = Cookies.get('user_id');

    // Modals
    const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const { isOpen: isPaymentOpen, onOpen: onPaymentOpen, onClose: onPaymentClose } = useDisclosure();

    // loading satates
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    // States
    const [partners, setPartners] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [debouncedText, setDebouncedText] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: ''
    });

    // Payment data
    const [paymentData, setPaymentData] = useState({
        amount: '',
        methodId: '',
        cashId: '',
        note: ''
    });

    // Payment options
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [cashboxes, setCashboxes] = useState([]);
    const [loadingPaymentOptions, setLoadingPaymentOptions] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedText(searchText);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchText]);

    // Fetch partners
    const fetchPartners = async () => {
        if (!mainWarehouseId) return;
        setLoading(true);
        try {
            const res = await apiLocations.getFilteredLocalLocationsByType(
                mainWarehouseId,
                'partner',
                debouncedText || "all",
                page,
                limit
            );
            if (res.data.status === 200) {
                setPartners(res.data.data.records);
                setPagination(res.data.data.pagination);
            }
        } catch (error) {
            toast({
                title: 'Xatolik',
                description: 'Ma\'lumotlarni yuklashda xatolik yuz berdi',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // if (mainWarehouseId) {
        fetchPartners();

        // }
    }, [debouncedText, page, limit, mainWarehouseId]);

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
    };

    // Format phone
    const formatPhone = (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('998')) {
            return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
        }
        return phone;
    };

    // Handle add partner
    const handleAddPartner = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone || !formData.address) {
            toast({
                title: 'Xatolik',
                description: 'Barcha maydonlarni to\'ldiring',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setAdding(true);
        try {
            const res = await apiLocations.Add({
                type: 'partner',
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
                parentId: mainWarehouseId,
                isCafe: false
            });
            onAddClose();
            setFormData({ name: '', phone: '', address: '' });
            fetchPartners();
        } finally {
            setAdding(false);
        }
    };

    // Handle edit partner
    const handleEditPartner = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone || !formData.address) {
            toast({
                title: 'Xatolik',
                description: 'Barcha maydonlarni to\'ldiring',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setEditing(true);
        try {
            const res = await apiLocations.Update({
                type: 'partner',
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
                parentId: selectedPartner.parentId,
                isCafe: false
            }, selectedPartner.id);

            onEditClose();
            setSelectedPartner(null);
            setFormData({ name: '', phone: '', address: '' });
            fetchPartners();
        } finally {
            setEditing(false);
        }
    };

    // Handle delete partner
    const handleDeletePartner = async () => {
        setDeleting(true);
        try {
            const res = await apiLocations.Delete(selectedPartner.id);
            onDeleteClose();
            setSelectedPartner(null);
            fetchPartners();
        } finally {
            setDeleting(false);
        }
    };

    // Open edit modal
    const openEditModal = (partner) => {
        setSelectedPartner(partner);
        setFormData({
            name: partner.name,
            phone: partner.phone,
            address: partner.address
        });
        onEditOpen();
    };

    // Open delete modal
    const openDeleteModal = (partner) => {
        setSelectedPartner(partner);
        onDeleteOpen();
    };

    // Open payment modal
    const openPaymentModal = async (partner) => {
        setSelectedPartner(partner);
        setPaymentData({
            amount: partner.balance,
            methodId: '',
            cashId: '',
            note: ''
        });
        onPaymentOpen();

        // Fetch payment methods and cashboxes
        setLoadingPaymentOptions(true);
        try {
            const [methodsRes, cashRes] = await Promise.all([
                apiPayMethods.getAll(),
                apiCashs.getAll()
            ]);

            const filteredMethods = methodsRes.data.payMethods.filter(
                m => m.locationId === mainWarehouseId
            );
            const filteredCashboxes = cashRes.data.filter(
                c => c.locationId === mainWarehouseId
            );

            setPaymentMethods(filteredMethods);
            setCashboxes(filteredCashboxes);
        } catch (error) {
            toast({
                title: 'Xatolik',
                description: 'To\'lov ma\'lumotlarini yuklashda xatolik',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            console.error(error);
        } finally {
            setLoadingPaymentOptions(false);
        }
    };

    // Handle payment
    const handlePayment = async (e) => {
        e.preventDefault();
        if (!paymentData.amount || !paymentData.methodId || !paymentData.cashId) {
            toast({
                title: 'Xatolik',
                description: 'Barcha majburiy maydonlarni to\'ldiring',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        setProcessingPayment(true);
        try {
            const res = await apiLocationPayment.Add({
                amount: paymentData.amount,
                methodId: paymentData.methodId,
                status: 'confirmed',
                cashId: paymentData.cashId,
                payerId: mainWarehouseId,
                receiverId: selectedPartner.id,
                note: paymentData.note,
                createdBy: userId
            });
            onPaymentClose();
            setSelectedPartner(null);
            setPaymentData({ amount: '', methodId: '', cashId: '', note: '' });
            fetchPartners();
        } finally {
            setProcessingPayment(false);
        }
    };

    // Navigate to partner detail
    const goToPartnerDetail = (partnerId) => {
        navigate(`/ombor/taminotchilar/${partnerId}`);
    };

    return (
        <Box minH="100vh" p={6}>
            {/* Header */}
            <Flex mb={6} justify="space-between" align="center">
                <Box>
                    <Heading size="xl">Taminotchilar</Heading>
                    <Text mt={1}>
                        Jami: {pagination?.total_count || 0} ta taminotchi
                    </Text>
                </Box>
                <Button
                    leftIcon={<Plus size={20} />}
                    colorScheme="blue"
                    onClick={onAddOpen}
                >
                    Yangi taminotchi
                </Button>
            </Flex>

            {/* Search & Filters */}
            <Card mb={6}>
                <CardBody>
                    <Flex gap={4}>
                        <InputGroup flex={1}>
                            <InputLeftElement pointerEvents="none">
                                <Search size={20} color="gray" />
                            </InputLeftElement>
                            <Input
                                placeholder="Taminotchi qidirish..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </InputGroup>
                        <Select
                            w="150px"
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            <option value={20}>20 ta</option>
                            <option value={50}>50 ta</option>
                            <option value={100}>100 ta</option>
                        </Select>
                    </Flex>
                </CardBody>
            </Card>

            {/* Table */}
            <Card>
                <CardBody p={0}>
                    {loading ? (
                        <Flex justify="center" align="center" py={12}>
                            <Spinner size="xl" color="blue.500" thickness="4px" />
                        </Flex>
                    ) : (
                        <Box>
                            {partners.length > 0 ?
                                (
                                    <Box overflowX="auto">
                                        <Table variant="simple">
                                            <Thead borderBottom="2px solid" borderColor="gray.200">
                                                <Tr >
                                                    <Th>№</Th>
                                                    <Th>Nomi</Th>
                                                    <Th>Telefon</Th>
                                                    <Th>Manzil</Th>
                                                    <Th>Balans</Th>
                                                    <Th isNumeric>Amallar</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {partners.map((partner, index) => (
                                                    <Tr
                                                        key={partner.id}
                                                        _hover={{ bg: 'bg' }}
                                                        cursor="pointer"
                                                        onClick={() => goToPartnerDetail(partner.id)}
                                                    >
                                                        <Td>{(page - 1) * limit + index + 1}</Td>
                                                        <Td fontWeight="medium">{partner.name}</Td>
                                                        <Td>{formatPhone(partner.phone)}</Td>
                                                        <Td>{partner.address}</Td>
                                                        <Td>
                                                            <Text
                                                                fontWeight="semibold"
                                                                color={
                                                                    Number(partner.balance) > 0 ? 'red.500' :
                                                                        Number(partner.balance) < 0 ? 'green.500' :
                                                                            'gray.600'
                                                                }
                                                            >
                                                                {formatCurrency(Math.abs(partner.balance))}
                                                            </Text>
                                                        </Td>
                                                        <Td isNumeric>
                                                            <HStack justify="flex-end" spacing={2}>
                                                                <IconButton
                                                                    aria-label="To'lov"
                                                                    icon={<DollarSign size={18} />}
                                                                    colorScheme="green"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openPaymentModal(partner);
                                                                    }}
                                                                />
                                                                <IconButton
                                                                    aria-label="Tahrirlash"
                                                                    icon={<Edit2 size={18} />}
                                                                    colorScheme="blue"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openEditModal(partner);
                                                                    }}
                                                                />
                                                                <IconButton
                                                                    aria-label="O'chirish"
                                                                    icon={<Trash2 size={18} />}
                                                                    colorScheme="red"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openDeleteModal(partner);
                                                                    }}
                                                                />
                                                            </HStack>
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                ) : (
                                    <VStack py={12} spacing={4}>
                                        <Text color="gray.500" fontSize="lg">Hozircha taminotchilar yo'q</Text>
                                        <Button colorScheme="blue" variant="link" onClick={onAddOpen}>
                                            Birinchi taminotchini qo'shish
                                        </Button>
                                    </VStack>
                                )}
                        </Box>


                    )}

                    {/* Pagination */}
                    {pagination && pagination.total_pages > 1 && (
                        <Box borderTop="1px" borderColor="gray.200" bg="suface">
                            <Flex px={6} py={4} justify="space-between" align="center">
                                <Text fontSize="sm">
                                    {(page - 1) * limit + 1} - {Math.min(page * limit, pagination.total_count)} / {pagination.total_count}
                                </Text>
                                <HStack spacing={2}>
                                    <IconButton
                                        aria-label="Previous"
                                        icon={<ChevronLeft size={20} />}
                                        onClick={() => setPage(p => p - 1)}
                                        isDisabled={!pagination.hasPrev}
                                        variant="outline"
                                    />
                                    {[...Array(pagination.total_pages)].map((_, i) => (
                                        <Button
                                            key={i}
                                            onClick={() => setPage(i + 1)}
                                            colorScheme={page === i + 1 ? 'blue' : 'gray'}
                                            variant={page === i + 1 ? 'solid' : 'outline'}
                                            size="sm"
                                        >
                                            {i + 1}
                                        </Button>
                                    ))}
                                    <IconButton
                                        aria-label="Next"
                                        icon={<ChevronRight size={20} />}
                                        onClick={() => setPage(p => p + 1)}
                                        isDisabled={!pagination.hasNext}
                                        variant="outline"
                                    />
                                </HStack>
                            </Flex>
                        </Box>
                    )}
                </CardBody>
            </Card>

            {/* Add Partner Modal */}
            <Modal isOpen={isAddOpen} onClose={onAddClose} size="md">
                <ModalOverlay />
                <ModalContent>
                    <form onSubmit={handleAddPartner}>
                        <ModalHeader>Yangi taminotchi</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Stack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel>Nomi</FormLabel>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Taminotchi nomi"
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Telefon</FormLabel>
                                    <Input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+998 90 123 45 67"
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Manzil</FormLabel>
                                    <Textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Manzil"
                                        rows={3}
                                    />
                                </FormControl>
                            </Stack>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={onAddClose}>
                                Bekor qilish
                            </Button>
                            <Button isLoading={adding} loadingText="Qo'shilyapti..." colorScheme="blue" type="submit">
                                Qo'shish
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            {/* Edit Partner Modal */}
            <Modal isOpen={isEditOpen} onClose={onEditClose} size="md">
                <ModalOverlay />
                <ModalContent>
                    <form onSubmit={handleEditPartner}>
                        <ModalHeader>Taminotchini tahrirlash</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Stack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel>Nomi</FormLabel>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Telefon</FormLabel>
                                    <Input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Manzil</FormLabel>
                                    <Textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        rows={3}
                                    />
                                </FormControl>
                            </Stack>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={onEditClose}>
                                Bekor qilish
                            </Button>
                            <Button isLoading={editing} loadingText="Saqlanmoqda..." colorScheme="blue" type="submit">
                                Saqlash
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="md">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Taminotchini o'chirish</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>
                            <strong>{selectedPartner?.name}</strong> taminotchisini o'chirishni tasdiqlaysizmi?
                            Bu amalni qaytarib bo'lmaydi.
                        </Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onDeleteClose}>
                            Bekor qilish
                        </Button>
                        <Button isLoading={deleting} loadingText="O'chirilyapti..." colorScheme="red" onClick={handleDeletePartner}>
                            O'chirish
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={isPaymentOpen} onClose={onPaymentClose} size="md">
                <ModalOverlay />
                <ModalContent>
                    <form onSubmit={handlePayment}>
                        <ModalHeader>
                            To'lov qilish - {selectedPartner?.name}
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            {loadingPaymentOptions ? (
                                <Flex justify="center" py={8}>
                                    <Spinner size="lg" color="blue.500" />
                                </Flex>
                            ) : (
                                <Stack spacing={4}>
                                    <Box>
                                        <Text fontSize="sm" mb={1}>
                                            Joriy balans
                                        </Text>
                                        <Text
                                            fontSize="2xl"
                                            fontWeight="bold"
                                            color={
                                                Number(selectedPartner?.balance) > 0 ? 'red.500' :
                                                    Number(selectedPartner?.balance) < 0 ? 'green.500' :
                                                        'gray.600'
                                            }
                                        >
                                            {formatCurrency(Math.abs(selectedPartner?.balance || 0))}
                                        </Text>
                                    </Box>

                                    <FormControl isRequired>
                                        <FormLabel>To'lov summasi</FormLabel>
                                        <NumberInput
                                            value={paymentData.amount}
                                            onChange={(value) => setPaymentData({ ...paymentData, amount: value })}
                                            min={0}
                                        >
                                            <NumberInputField placeholder="Summa" />
                                        </NumberInput>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel>To'lov usuli</FormLabel>
                                        <Select
                                            value={paymentData.methodId}
                                            onChange={(e) => setPaymentData({ ...paymentData, methodId: e.target.value })}
                                            placeholder="To'lov usulini tanlang"
                                        >
                                            {paymentMethods.map(method => (
                                                <option key={method.id} value={method.id}>
                                                    {method.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel>Kassa</FormLabel>
                                        <Select
                                            value={paymentData.cashId}
                                            onChange={(e) => setPaymentData({ ...paymentData, cashId: e.target.value })}
                                            placeholder="Kassani tanlang"
                                        >
                                            {cashboxes.map(cash => (
                                                <option key={cash.id} value={cash.id}>
                                                    {cash.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Izoh</FormLabel>
                                        <Textarea
                                            value={paymentData.note}
                                            onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                                            placeholder="Izoh (ixtiyoriy)"
                                            rows={3}
                                        />
                                    </FormControl>
                                </Stack>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={onPaymentClose}>
                                Bekor qilish
                            </Button>
                            <Button isLoading={processingPayment} loadingText="To'lov amalga oshirilyapti..." colorScheme="green" type="submit">
                                To'lash
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default TaminotchilarPage;