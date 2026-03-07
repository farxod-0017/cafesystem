import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Form } from 'react-router-dom';
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
    useDisclosure,
    useToast,
    Spinner,
    Badge,
    HStack,
    VStack,
    Card,
    CardBody,
    NumberInput,
    NumberInputField,
    Stack,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Avatar,
    Checkbox,
    Tag,
    TagLabel,
    TagCloseButton,
    Wrap,
    WrapItem,
    useColorMode,
    useColorModeValue,
    Divider,
    Tooltip,
    Alert,
    AlertIcon,
    AlertDescription,
    Icon
} from '@chakra-ui/react';
import {
    ArrowLeft, DollarSign, ChevronLeft, ChevronRight,
    Phone, MapPin, Calendar, CheckCircle, XCircle,
    AlertCircle, Loader2, Package, Receipt
} from 'lucide-react';
import { apiLocations } from '../../../utils/Controllers/apiLocations';
import { apiInvoices } from '../../../utils/Controllers/Invoices';
import { apiLocationPayment } from '../../../utils/Controllers/apiLocationPayment';
import { apiPayMethods } from '../../../utils/Controllers/apiPayMethods';
import { apiCashs } from '../../../utils/Controllers/apiCashs';
import Cookies from 'js-cookie';
import { useWarehouseStore } from '../../../store/useWarehouseStore';

const PartnerDetailPage = () => {
    const { partnerId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { colorMode } = useColorMode();
    const { mainWarehouseId } = useWarehouseStore();
    const userId = Cookies.get('user_id');
    const [formLoading, setFormLoading] = useState({
        generalPay: false,
        invPay: false,

    })

    // Color mode values
    const bg = useColorModeValue('white', 'gray.800');
    const bgAlt = useColorModeValue('gray.50', 'gray.900');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textPrimary = useColorModeValue('gray.800', 'white');
    const textSecondary = useColorModeValue('gray.600', 'gray.300');

    // Modals
    const { isOpen: isGeneralPaymentOpen, onOpen: onGeneralPaymentOpen, onClose: onGeneralPaymentClose } = useDisclosure();
    const { isOpen: isInvoicePaymentOpen, onOpen: onInvoicePaymentOpen, onClose: onInvoicePaymentClose } = useDisclosure();

    // Partner data
    const [partner, setPartner] = useState(null);
    const [loadingPartner, setLoadingPartner] = useState(true);

    // Invoices
    const [invoices, setInvoices] = useState([]);
    const [invoicesPagination, setInvoicesPagination] = useState(null);
    const [invoicesPage, setInvoicesPage] = useState(1);
    const [invoiceStatus, setInvoiceStatus] = useState('all');
    const [invoicePaymentStatus, setInvoicePaymentStatus] = useState('all');
    const [invoiceStartDate, setInvoiceStartDate] = useState('');
    const [invoiceEndDate, setInvoiceEndDate] = useState('');
    const [loadingInvoices, setLoadingInvoices] = useState(false);

    // Invoice selection
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedInvoices, setSelectedInvoices] = useState([]);

    // Payments history
    const [payments, setPayments] = useState([]);
    const [paymentsPagination, setPaymentsPagination] = useState(null);
    const [paymentsPage, setPaymentsPage] = useState(1);
    const [loadingPayments, setLoadingPayments] = useState(false);

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

    // Fetch partner data
    const fetchPartner = async () => {
        setLoadingPartner(true);
        try {
            const res = await apiLocations.getById(partnerId);
            if (res.data) {
                setPartner(res.data);
            }
        } catch (error) {
            toast({
                title: 'Xatolik',
                description: 'Partner ma\'lumotlarini yuklashda xatolik',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoadingPartner(false);
        }
    };

    useEffect(() => {
        if (partnerId) {
            fetchPartner();
        }
    }, [partnerId]);

    // Fetch invoices
    const fetchInvoices = async () => {
        setLoadingInvoices(true);
        try {
            const res = await apiInvoices.getFilteredInvoices(
                partnerId,
                invoiceStartDate || 'all',
                invoiceEndDate || 'all',
                'incoming',
                invoiceStatus,
                invoicePaymentStatus,
                'all',
                invoicesPage
            );
            // Filter by partner (senderId should match partnerId for incoming)
            const partnerInvoices = res.data.data.records.filter(
                inv => inv.senderId === partnerId
            );
            setInvoices(partnerInvoices);
            setInvoicesPagination(res.data.data.pagination);
        } catch (error) {
            toast({
                title: 'Xatolik',
                description: 'Invoicelarni yuklashda xatolik',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoadingInvoices(false);
        }
    };

    useEffect(() => {
        if (mainWarehouseId && partnerId) {
            fetchInvoices();
        }
    }, [mainWarehouseId, partnerId, invoicesPage, invoiceStatus, invoicePaymentStatus, invoiceStartDate, invoiceEndDate]);

    // Fetch payments
    const fetchPayments = async () => {
        setLoadingPayments(true);
        try {
            const res = await apiLocationPayment.getFilterPayerReceiverIDs(
                mainWarehouseId,
                partnerId,
                paymentsPage
            );
            setPayments(res.data.data.records);
            setPaymentsPagination(res.data.data.pagination);
        } catch (error) {
            toast({
                title: 'Xatolik',
                description: 'To\'lovlarni yuklashda xatolik',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoadingPayments(false);
        }
    };

    useEffect(() => {
        if (mainWarehouseId && partnerId) {
            fetchPayments();
        }
    }, [mainWarehouseId, partnerId, paymentsPage]);

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

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('uz-UZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get payment status badge
    const getPaymentStatusBadge = (status) => {
        const statusMap = {
            paid: { colorScheme: 'green', text: 'To\'langan' },
            unpaid: { colorScheme: 'red', text: 'To\'lanmagan' },
            partially_paid: { colorScheme: 'orange', text: 'Qisman to\'langan' }
        };
        return statusMap[status] || { colorScheme: 'gray', text: status };
    };

    // Toggle selection mode
    const toggleSelectionMode = () => {
        if (selectionMode) {
            setSelectedInvoices([]);
        }
        setSelectionMode(!selectionMode);
    };

    // Toggle invoice selection
    const toggleInvoiceSelection = (invoice) => {
        if (invoice.paymentStatus === 'paid') return;

        const isSelected = selectedInvoices.find(inv => inv.id === invoice.id);
        if (isSelected) {
            setSelectedInvoices(selectedInvoices.filter(inv => inv.id !== invoice.id));
        } else {
            setSelectedInvoices([...selectedInvoices, invoice]);
        }
    };

    // Remove selected invoice
    const removeSelectedInvoice = (invoiceId) => {
        setSelectedInvoices(selectedInvoices.filter(inv => inv.id !== invoiceId));
    };

    // Calculate total selected amount
    const calculateSelectedTotal = () => {
        return selectedInvoices.reduce((sum, inv) => sum + Number(inv.totalSum), 0);
    };

    // Open general payment modal
    const openGeneralPayment = async () => {
        setPaymentData({
            amount: partner?.balance > 0 ? partner?.balance : '',
            methodId: '',
            cashId: '',
            note: ''
        });
        onGeneralPaymentOpen();

        // Fetch payment options
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
        } finally {
            setLoadingPaymentOptions(false);
        }
    };

    // Open invoice payment modal
    const openInvoicePayment = async () => {
        if (selectedInvoices.length === 0) {
            toast({
                title: 'Ogohlantirish',
                description: 'Kamida 1 ta invoice tanlang',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const totalAmount = calculateSelectedTotal();
        setPaymentData({
            amount: totalAmount.toString(),
            methodId: '',
            cashId: '',
            note: ''
        });
        onInvoicePaymentOpen();

        // Fetch payment options
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
        } finally {
            setLoadingPaymentOptions(false);
        }
    };

    // Handle general payment
    const handleGeneralPayment = async (e) => {
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
        setFormLoading({ ...formLoading, generalPay: true })
        try {
            const res = await apiLocationPayment.Add({
                amount: Number(paymentData.amount),
                methodId: paymentData.methodId,
                status: 'confirmed',
                cashId: paymentData.cashId,
                payerId: mainWarehouseId,
                receiverId: partnerId,
                note: paymentData.note,
                createdBy: userId
            });

            onGeneralPaymentClose();
            setPaymentData({ amount: '', methodId: '', cashId: '', note: '' });
            fetchPartner();
            fetchPayments();
        } finally {
            setFormLoading({ ...formLoading, generalPay: false })
        }
    };

    // Handle invoice payment
    const handleInvoicePayment = async (e) => {
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
        setFormLoading({ ...formLoading, invPay: true })
        try {
            const invoicesPayload = selectedInvoices.map(inv => ({
                invoiceId: inv.id
            }));

            const res = await apiLocationPayment.Add({
                amount: Number(paymentData.amount),
                methodId: paymentData.methodId,
                status: 'confirmed',
                cashId: paymentData.cashId,
                payerId: mainWarehouseId,
                receiverId: partnerId,
                note: paymentData.note,
                createdBy: userId,
                invoices: invoicesPayload
            });

            onInvoicePaymentClose();
            setPaymentData({ amount: '', methodId: '', cashId: '', note: '' });
            setSelectedInvoices([]);
            setSelectionMode(false);
            fetchPartner();
            fetchInvoices();
            fetchPayments();
        } finally {
            setFormLoading({ ...formLoading, invPay: false })
        }
    };

    if (loadingPartner) {
        return (
            <Flex minH="100vh" bg={bgAlt} justify="center" align="center">
                <Spinner size="xl" color="blue.500" thickness="4px" />
            </Flex>
        );
    }

    if (!partner) {
        return (
            <Box minH="100vh" bg={"bg"} p={6}>
                <Card>
                    <CardBody>
                        <VStack spacing={4} py={8}>
                            <Icon as={AlertCircle} boxSize={16} color="red.500" />
                            <Text fontSize="lg" color={textSecondary}>Partner topilmadi</Text>
                            <Button leftIcon={<ArrowLeft size={18} />} onClick={() => navigate('/ombor/taminotchilar')}>
                                Orqaga
                            </Button>
                        </VStack>
                    </CardBody>
                </Card>
            </Box>
        );
    }

    return (
        <Box minH="100vh" bg={"bg"} pb={6}>
            {/* Header */}
            <Box bg={"bg"} borderBottom="1px" borderColor={"border"} px={6} py={4}>
                <Flex align="center" gap={4}>
                    <IconButton
                        aria-label="Orqaga"
                        icon={<ArrowLeft size={20} />}
                        variant="ghost"
                        onClick={() => navigate('/ombor/taminotchilar')}
                    />
                    <Heading size="lg" color={textPrimary}>Taminotchi</Heading>
                </Flex>
            </Box>

            {/* Partner Info Hero */}
            <Box px={6} py={6}>
                <Card>
                    <CardBody>
                        <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
                            {/* Avatar & Basic Info */}
                            <Flex gap={4} align="start" flex={1}>
                                <Avatar
                                    size="xl"
                                    name={partner.name}
                                    bg="blue.500"
                                    color="white"
                                />
                                <VStack align="start" spacing={2} flex={1}>
                                    <Heading size="md">{partner.name}</Heading>
                                    <HStack color="textSecondary" fontSize="sm">
                                        <Icon as={Phone} boxSize={4} />
                                        <Text>{formatPhone(partner.phone)}</Text>
                                    </HStack>
                                    <HStack color="textSecondary" fontSize="sm">
                                        <Icon as={MapPin} boxSize={4} />
                                        <Text>{partner.address}</Text>
                                    </HStack>
                                    <HStack color="textSecondary" fontSize="sm">
                                        <Icon as={Calendar} boxSize={4} />
                                        <Text>Qo'shildi: {formatDate(partner.createdAt)}</Text>
                                    </HStack>
                                </VStack>
                            </Flex>

                            {/* Balance & Actions */}
                            <VStack align={{ base: 'stretch', md: 'end' }} spacing={4}>
                                <Box textAlign={{ base: 'left', md: 'right' }}>
                                    <Text fontSize="sm" color="textSecondary" mb={1}>Joriy balans {+partner?.balance > 0 ? "(bizning qarz)" : "(bizdan qarz)"}</Text>
                                    <Text
                                        fontSize="3xl"
                                        fontWeight="bold"
                                        color={
                                            Number(partner.balance) < 0 ? 'red.500' :
                                                Number(partner.balance) > 0 ? 'green.500' :
                                                    'gray.600'
                                        }
                                    >
                                        {formatCurrency(partner.balance)}
                                    </Text>
                                </Box>
                                <Button
                                    leftIcon={<DollarSign size={18} />}
                                    colorScheme="green"
                                    size="lg"
                                    onClick={openGeneralPayment}
                                    w={{ base: 'full', md: 'auto' }}
                                >
                                    To'lov qilish
                                </Button>
                            </VStack>
                        </Flex>
                    </CardBody>
                </Card>
            </Box>

            {/* Tabs */}
            <Box px={6}>
                <Tabs colorScheme="blue" variant="enclosed">
                    <TabList>
                        <Tab>
                            <HStack>
                                <Icon as={Package} boxSize={4} />
                                <Text>Invoicelar</Text>
                            </HStack>
                        </Tab>
                        <Tab>
                            <HStack>
                                <Icon as={Receipt} boxSize={4} />
                                <Text>To'lovlar tarixi</Text>
                            </HStack>
                        </Tab>
                    </TabList>

                    <TabPanels>
                        {/* Invoices Tab */}
                        <TabPanel px={0} pt={4}>
                            <Card>
                                <CardBody>
                                    {/* Filters */}
                                    <Stack spacing={4} mb={4}>
                                        <Flex gap={4} direction={{ base: 'column', md: 'row' }} wrap="wrap">
                                            <FormControl maxW={{ md: '200px' }}>
                                                <FormLabel fontSize="sm">Status</FormLabel>
                                                <Select
                                                    value={invoiceStatus}
                                                    onChange={(e) => {
                                                        setInvoiceStatus(e.target.value);
                                                        setInvoicesPage(1);
                                                    }}
                                                    size="sm"
                                                >
                                                    <option value={"all"}>Barchasi</option>
                                                    <option value="received">Qabul qilingan</option>
                                                    <option value="cancelled">Bekor qilingan</option>
                                                </Select>
                                            </FormControl>

                                            <FormControl maxW={{ md: '200px' }}>
                                                <FormLabel fontSize="sm">To'lov holati</FormLabel>
                                                <Select
                                                    value={invoicePaymentStatus}
                                                    onChange={(e) => {
                                                        setInvoicePaymentStatus(e.target.value);
                                                        setInvoicesPage(1);
                                                    }}
                                                    size="sm"
                                                >
                                                    <option value={"all"}>Barchasi</option>
                                                    <option value="paid">To'langan</option>
                                                    <option value="unpaid">To'lanmagan</option>
                                                    <option value="partially_paid">Qisman to'langan</option>
                                                </Select>
                                            </FormControl>

                                            <FormControl maxW={{ md: '200px' }}>
                                                <FormLabel fontSize="sm">Boshlanish</FormLabel>
                                                <Input
                                                    type="date"
                                                    value={invoiceStartDate}
                                                    onChange={(e) => {
                                                        setInvoiceStartDate(e.target.value);
                                                        setInvoicesPage(1);
                                                    }}
                                                    size="sm"
                                                />
                                            </FormControl>

                                            <FormControl maxW={{ md: '200px' }}>
                                                <FormLabel fontSize="sm">Tugash</FormLabel>
                                                <Input
                                                    type="date"
                                                    value={invoiceEndDate}
                                                    onChange={(e) => {
                                                        setInvoiceEndDate(e.target.value);
                                                        setInvoicesPage(1);
                                                    }}
                                                    size="sm"
                                                />
                                            </FormControl>
                                        </Flex>

                                        {/* Selection Mode Controls */}
                                        {!selectionMode ? (
                                            <Button
                                                leftIcon={<CheckCircle size={18} />}
                                                colorScheme="blue"
                                                variant="outline"
                                                size="sm"
                                                onClick={toggleSelectionMode}
                                                w={{ base: 'full', md: 'fit-content' }}
                                            >
                                                Invoicelar uchun to'lov
                                            </Button>
                                        ) : (
                                            <Box>
                                                <Flex
                                                    p={4}
                                                    bg={useColorModeValue('blue.50', 'blue.900')}
                                                    borderRadius="lg"
                                                    justify="space-between"
                                                    align="center"
                                                    direction={{ base: 'column', md: 'row' }}
                                                    gap={4}
                                                >
                                                    <VStack align="start" spacing={1}>
                                                        <Text fontWeight="bold" color={textPrimary}>
                                                            {selectedInvoices.length} ta invoice tanlandi
                                                        </Text>
                                                        <Text fontSize="lg" fontWeight="semibold" color="blue.600">
                                                            Jami: {formatCurrency(calculateSelectedTotal())}
                                                        </Text>
                                                    </VStack>
                                                    <HStack>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={toggleSelectionMode}
                                                        >
                                                            Bekor qilish
                                                        </Button>
                                                        <Button
                                                            colorScheme="green"
                                                            size="sm"
                                                            onClick={openInvoicePayment}
                                                            isDisabled={selectedInvoices.length === 0}
                                                        >
                                                            To'lov qilish
                                                        </Button>
                                                    </HStack>
                                                </Flex>

                                                {/* Selected Invoice Tags */}
                                                {selectedInvoices.length > 0 && (
                                                    <Wrap mt={3}>
                                                        {selectedInvoices.map(inv => (
                                                            <WrapItem key={inv.id}>
                                                                <Tag
                                                                    size="md"
                                                                    borderRadius="full"
                                                                    variant="solid"
                                                                    colorScheme="blue"
                                                                >
                                                                    <TagLabel>{inv.invNumber}</TagLabel>
                                                                    <TagCloseButton onClick={() => removeSelectedInvoice(inv.id)} />
                                                                </Tag>
                                                            </WrapItem>
                                                        ))}
                                                    </Wrap>
                                                )}
                                            </Box>
                                        )}
                                    </Stack>

                                    <Divider my={4} />

                                    {/* Invoices Table */}
                                    {loadingInvoices ? (
                                        <Flex justify="center" py={12}>
                                            <Spinner size="xl" color="blue.500" thickness="4px" />
                                        </Flex>
                                    ) : invoices.length === 0 ? (
                                        <VStack py={12} spacing={4}>
                                            <Icon as={Package} boxSize={16} color="gray.400" />
                                            <Text color={textSecondary} fontSize="lg">Hozircha invoicelar yo'q</Text>
                                        </VStack>
                                    ) : (
                                        <Box overflowX="auto">
                                            <Table variant="simple" size="sm">
                                                <Thead>
                                                    <Tr>
                                                        {selectionMode && <Th w="50px"></Th>}
                                                        <Th>Invoice №</Th>
                                                        <Th>Summa</Th>
                                                        <Th>To'lov holati</Th>
                                                        {invoiceStatus === 'cancelled' && <Th>Status</Th>}
                                                        <Th>Sana</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {invoices.map(invoice => (
                                                        <Tr key={invoice.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                                                            {selectionMode && (
                                                                <Td>
                                                                    <Checkbox
                                                                        isChecked={selectedInvoices.some(inv => inv.id === invoice.id)}
                                                                        onChange={() => toggleInvoiceSelection(invoice)}
                                                                        isDisabled={invoice.paymentStatus === 'paid'}
                                                                    />
                                                                </Td>
                                                            )}
                                                            <Td fontWeight="medium">{invoice.invNumber}</Td>
                                                            <Td fontWeight="semibold">{formatCurrency(invoice.totalSum)}</Td>
                                                            <Td>
                                                                <Badge {...getPaymentStatusBadge(invoice.paymentStatus)}>
                                                                    {getPaymentStatusBadge(invoice.paymentStatus).text}
                                                                </Badge>
                                                            </Td>
                                                            {invoiceStatus === 'cancelled' && (
                                                                <Td>
                                                                    <Badge colorScheme="gray">Bekor qilingan</Badge>
                                                                </Td>
                                                            )}
                                                            <Td fontSize="sm" color={textSecondary}>
                                                                {formatDate(invoice.createdAt)}
                                                            </Td>
                                                        </Tr>
                                                    ))}
                                                </Tbody>
                                            </Table>
                                        </Box>
                                    )}

                                    {/* Pagination */}
                                    {invoicesPagination && invoicesPagination.total_pages > 1 && (
                                        <Flex mt={4} justify="space-between" align="center">
                                            <Text fontSize="sm" color={textSecondary}>
                                                Sahifa {invoicesPagination.currentPage} / {invoicesPagination.total_pages}
                                            </Text>
                                            <HStack spacing={2}>
                                                <IconButton
                                                    aria-label="Previous"
                                                    icon={<ChevronLeft size={20} />}
                                                    onClick={() => setInvoicesPage(p => p - 1)}
                                                    isDisabled={invoicesPagination.currentPage === 1}
                                                    variant="outline"
                                                    size="sm"
                                                />
                                                {[...Array(invoicesPagination.total_pages)].map((_, i) => (
                                                    <Button
                                                        key={i}
                                                        onClick={() => setInvoicesPage(i + 1)}
                                                        colorScheme={invoicesPagination.currentPage === i + 1 ? 'blue' : 'gray'}
                                                        variant={invoicesPagination.currentPage === i + 1 ? 'solid' : 'outline'}
                                                        size="sm"
                                                    >
                                                        {i + 1}
                                                    </Button>
                                                ))}
                                                <IconButton
                                                    aria-label="Next"
                                                    icon={<ChevronRight size={20} />}
                                                    onClick={() => setInvoicesPage(p => p + 1)}
                                                    isDisabled={invoicesPagination.currentPage === invoicesPagination.total_pages}
                                                    variant="outline"
                                                    size="sm"
                                                />
                                            </HStack>
                                        </Flex>
                                    )}
                                </CardBody>
                            </Card>
                        </TabPanel>

                        {/* Payments History Tab */}
                        <TabPanel px={0} pt={4}>
                            <Card>
                                <CardBody>
                                    {loadingPayments ? (
                                        <Flex justify="center" py={12}>
                                            <Spinner size="xl" color="blue.500" thickness="4px" />
                                        </Flex>
                                    ) : payments.length === 0 ? (
                                        <VStack py={12} spacing={4}>
                                            <Icon as={Receipt} boxSize={16} color="gray.400" />
                                            <Text color={textSecondary} fontSize="lg">To'lovlar tarixi bo'sh</Text>
                                            <Text color={textSecondary} fontSize="sm">Birinchi to'lovni amalga oshiring</Text>
                                        </VStack>
                                    ) : (
                                        <Box overflowX="auto">
                                            <Table variant="simple" size="sm">
                                                <Thead>
                                                    <Tr>
                                                        <Th>Summa</Th>
                                                        <Th>Kassa</Th>
                                                        <Th>To'lov usuli</Th>
                                                        <Th>Kim tomonidan</Th>
                                                        <Th>Invoicelar</Th>
                                                        <Th>Izoh</Th>
                                                        <Th>Sana</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {payments.map(payment => (
                                                        <Tr key={payment.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                                                            <Td>
                                                                <Text fontWeight="bold" fontSize="lg" color="green.500">
                                                                    {formatCurrency(payment.amount)}
                                                                </Text>
                                                            </Td>
                                                            <Td>{payment.cash?.name || '-'}</Td>
                                                            <Td>
                                                                <Badge colorScheme="blue">
                                                                    {payment.method?.name || '-'}
                                                                </Badge>
                                                            </Td>
                                                            <Td fontSize="sm">{payment.created?.full_name || '-'}</Td>
                                                            <Td>
                                                                {payment.invoices && payment.invoices.length > 0 ? (
                                                                    <Tooltip
                                                                        label={payment.invoices.map(inv => inv.invNumber || inv.invoiceId).join(', ')}
                                                                        placement="top"
                                                                    >
                                                                        <Badge colorScheme="purple">
                                                                            {payment.invoices.length} ta invoice
                                                                        </Badge>
                                                                    </Tooltip>
                                                                ) : (
                                                                    <Text fontSize="sm" color={textSecondary}>Umumiy to'lov</Text>
                                                                )}
                                                            </Td>
                                                            <Td fontSize="sm" color={textSecondary} maxW="200px" isTruncated>
                                                                {payment.note || '-'}
                                                            </Td>
                                                            <Td fontSize="sm" color={textSecondary}>
                                                                {formatDate(payment.createdAt)}
                                                            </Td>
                                                        </Tr>
                                                    ))}
                                                </Tbody>
                                            </Table>
                                        </Box>
                                    )}

                                    {/* Pagination */}
                                    {paymentsPagination && paymentsPagination.totalPages > 1 && (
                                        <Flex mt={4} justify="space-between" align="center">
                                            <Text fontSize="sm" color={textSecondary}>
                                                Sahifa {paymentsPagination.currentPage} / {paymentsPagination.totalPages}
                                            </Text>
                                            <HStack spacing={2}>
                                                <IconButton
                                                    aria-label="Previous"
                                                    icon={<ChevronLeft size={20} />}
                                                    onClick={() => setPaymentsPage(p => p - 1)}
                                                    isDisabled={paymentsPagination.currentPage === 1}
                                                    variant="outline"
                                                    size="sm"
                                                />
                                                {[...Array(paymentsPagination.totalPages)].map((_, i) => (
                                                    <Button
                                                        key={i}
                                                        onClick={() => setPaymentsPage(i + 1)}
                                                        colorScheme={paymentsPagination.currentPage === i + 1 ? 'blue' : 'gray'}
                                                        variant={paymentsPagination.currentPage === i + 1 ? 'solid' : 'outline'}
                                                        size="sm"
                                                    >
                                                        {i + 1}
                                                    </Button>
                                                ))}
                                                <IconButton
                                                    aria-label="Next"
                                                    icon={<ChevronRight size={20} />}
                                                    onClick={() => setPaymentsPage(p => p + 1)}
                                                    isDisabled={paymentsPagination.currentPage === paymentsPagination.totalPages}
                                                    variant="outline"
                                                    size="sm"
                                                />
                                            </HStack>
                                        </Flex>
                                    )}
                                </CardBody>
                            </Card>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>

            {/* General Payment Modal */}
            <Modal isOpen={isGeneralPaymentOpen} onClose={onGeneralPaymentClose} size="md">
                <ModalOverlay />
                <ModalContent>
                    <form onSubmit={handleGeneralPayment}>
                        <ModalHeader>Umumiy to'lov - {partner.name}</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            {loadingPaymentOptions ? (
                                <Flex justify="center" py={8}>
                                    <Spinner size="lg" color="blue.500" />
                                </Flex>
                            ) : (
                                <Stack spacing={4}>
                                    <Box>
                                        <Text fontSize="sm" color={textSecondary} mb={1}>
                                            Joriy balans
                                        </Text>
                                        <Text
                                            fontSize="2xl"
                                            fontWeight="bold"
                                            color={
                                                Number(partner.balance) < 0 ? 'red.500' :
                                                    Number(partner.balance) > 0 ? 'green.500' :
                                                        'gray.600'
                                            }
                                        >
                                            {formatCurrency(partner.balance)}
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
                            <Button variant="ghost" mr={3} onClick={onGeneralPaymentClose}>
                                Bekor qilish
                            </Button>
                            <Button isLoading={formLoading.generalPay} loadingText="Saqlanmoqda..." colorScheme="green" type="submit">
                                To'lash
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            {/* Invoice Payment Modal */}
            <Modal isOpen={isInvoicePaymentOpen} onClose={onInvoicePaymentClose} size="md">
                <ModalOverlay />
                <ModalContent>
                    <form onSubmit={handleInvoicePayment}>
                        <ModalHeader>To'lov tasdiqlash</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            {loadingPaymentOptions ? (
                                <Flex justify="center" py={8}>
                                    <Spinner size="lg" color="blue.500" />
                                </Flex>
                            ) : (
                                <Stack spacing={4}>
                                    {/* Selected Invoices */}
                                    <Box>
                                        <Text fontWeight="semibold" mb={2}>
                                            Tanlangan invoicelar ({selectedInvoices.length})
                                        </Text>
                                        <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto" p={3} bg={bgAlt} borderRadius="md">
                                            {selectedInvoices.map(inv => (
                                                <Flex key={inv.id} justify="space-between" align="center">
                                                    <Text fontSize="sm">{inv.invNumber}</Text>
                                                    <Text fontSize="sm" fontWeight="semibold">
                                                        {formatCurrency(inv.totalSum)}
                                                    </Text>
                                                </Flex>
                                            ))}
                                            <Divider />
                                            <Flex justify="space-between" align="center">
                                                <Text fontWeight="bold">Jami:</Text>
                                                <Text fontWeight="bold" fontSize="lg" color="blue.500">
                                                    {formatCurrency(calculateSelectedTotal())}
                                                </Text>
                                            </Flex>
                                        </VStack>
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
                                        {Number(paymentData.amount) !== calculateSelectedTotal() && (
                                            <Alert status={Number(paymentData.amount) > calculateSelectedTotal() ? 'warning' : 'info'} mt={2} borderRadius="md">
                                                <AlertIcon />
                                                <AlertDescription fontSize="sm">
                                                    {Number(paymentData.amount) > calculateSelectedTotal()
                                                        ? `Ortiqcha: +${formatCurrency(Number(paymentData.amount) - calculateSelectedTotal())}`
                                                        : `Kam: ${formatCurrency(calculateSelectedTotal() - Number(paymentData.amount))}`
                                                    }
                                                </AlertDescription>
                                            </Alert>
                                        )}
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
                            <Button variant="ghost" mr={3} onClick={onInvoicePaymentClose}>
                                Bekor qilish
                            </Button>
                            <Button isLoading={formLoading.invPay} loadingText="Saqlanmoqda..." colorScheme="green" type="submit">
                                To'lash {formatCurrency(Number(paymentData.amount) || 0)}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default PartnerDetailPage;