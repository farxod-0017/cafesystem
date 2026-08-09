import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  useColorModeValue,
  Divider,
  Alert,
  AlertIcon,
  AlertDescription,
  Icon,
  Grid,
  SkeletonText,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle,
  Package,
  Receipt,
} from "lucide-react";
import { apiLocations } from "../../../utils/Controllers/apiLocations";
import { apiLocationPayment } from "../../../utils/Controllers/apiLocationPayment";
import { apiInvoices } from "../../../utils/Controllers/Invoices";
import { apiPayMethods } from "../../../utils/Controllers/apiPayMethods";
import { apiCashs } from "../../../utils/Controllers/apiCashs";
import Cookies from "js-cookie";
import { useWarehouseStore } from "../../../store/useWarehouseStore";

const STATUS_LABELS = {
  sent: "Yuborildi",
  received: "Qabul qilindi",
  cancelled: "Bekor qilindi",
};

const STATUS_COLORS = {
  sent: "yellow",
  received: "green",
  cancelled: "red",
};

const PAYMENT_LABELS = {
  paid: "To'langan",
  unpaid: "To'lanmagan",
  partially_paid: "Qisman to'langan",
};

const PAYMENT_COLORS = {
  paid: "green",
  unpaid: "red",
  partially_paid: "orange",
};

const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatNumber = (num) => num?.toLocaleString("uz-UZ") || "0";

const PartnerDetailPage = () => {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { mainWarehouseId } = useWarehouseStore();
  const userId = Cookies.get("user_id");

  const [formLoading, setFormLoading] = useState({
    generalPay: false,
    invPay: false,
  });

  const bgAlt = useColorModeValue("gray.50", "gray.900");
  const textPrimary = useColorModeValue("gray.800", "white");
  const textSecondary = useColorModeValue("gray.600", "gray.300");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const selectionBg = useColorModeValue("blue.50", "blue.900");
  const mobileCardBg = useColorModeValue("white", "gray.800");
  const mobileCardBorder = useColorModeValue("gray.200", "gray.700");

  const {
    isOpen: isGeneralPaymentOpen,
    onOpen: onGeneralPaymentOpen,
    onClose: onGeneralPaymentClose,
  } = useDisclosure();
  const {
    isOpen: isInvoicePaymentOpen,
    onOpen: onInvoicePaymentOpen,
    onClose: onInvoicePaymentClose,
  } = useDisclosure();
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();
  const {
    isOpen: isPaymentDetailOpen,
    onOpen: onPaymentDetailOpen,
    onClose: onPaymentDetailClose,
  } = useDisclosure();

  const [partner, setPartner] = useState(null);
  const [loadingPartner, setLoadingPartner] = useState(true);

  const [invoices, setInvoices] = useState([]);
  const [invoicesPagination, setInvoicesPagination] = useState(null);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoiceStatus, setInvoiceStatus] = useState("all");
  const [invoicePaymentStatus, setInvoicePaymentStatus] = useState("all");
  const [invoiceStartDate, setInvoiceStartDate] = useState("");
  const [invoiceEndDate, setInvoiceEndDate] = useState("");
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] =
    useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [invoiceItemsPagination, setInvoiceItemsPagination] = useState(null);
  const [invoiceItemsPage, setInvoiceItemsPage] = useState(1);
  const [loadingInvoiceItems, setLoadingInvoiceItems] = useState(false);

  const [payments, setPayments] = useState([]);
  const [paymentsPagination, setPaymentsPagination] = useState(null);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [selectedPaymentForDetail, setSelectedPaymentForDetail] =
    useState(null);

  const [paymentData, setPaymentData] = useState({
    amount: "",
    methodId: "",
    cashId: "",
    note: "",
  });

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [cashboxes, setCashboxes] = useState([]);
  const [loadingPaymentOptions, setLoadingPaymentOptions] = useState(false);

  // --- Ikki marta so'rov ketishining oldini olish uchun ref'lar ---
  // Bu ref'lar har bir effekt uchun "oxirgi marta qaysi parametrlar bilan
  // so'rov yuborilgani"ni saqlab turadi. Agar effekt bir xil parametrlar
  // bilan qayta ishga tushsa (masalan React StrictMode double-invoke
  // tufayli, yoki komponent keraksiz qayta mount bo'lganda), so'rov
  // qaytadan yuborilmaydi.
  const partnerFetchedRef = useRef(null);
  const invoicesFetchedRef = useRef(null);
  const paymentsFetchedRef = useRef(null);

  const fetchPartner = async () => {
    setLoadingPartner(true);
    try {
      const res = await apiLocations.getById(partnerId);
      if (res.data) setPartner(res.data);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Partner ma'lumotlarini yuklashda xatolik",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingPartner(false);
    }
  };

  useEffect(() => {
    if (!partnerId) return;
    if (partnerFetchedRef.current === partnerId) return;
    partnerFetchedRef.current = partnerId;
    fetchPartner();
  }, [partnerId]);

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const res = await apiInvoices.getFilteredInvoices(
        partnerId,
        invoiceStartDate || "all",
        invoiceEndDate || "all",
        "incoming",
        invoiceStatus,
        invoicePaymentStatus,
        "all",
        invoicesPage,
      );
      const partnerInvoices = res.data.data.records.filter(
        (inv) => inv.senderId === partnerId,
      );
      setInvoices(partnerInvoices);
      setInvoicesPagination(res.data.data.pagination);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Invoicelarni yuklashda xatolik",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    if (!mainWarehouseId || !partnerId) return;
    const key = JSON.stringify([
      mainWarehouseId,
      partnerId,
      invoicesPage,
      invoiceStatus,
      invoicePaymentStatus,
      invoiceStartDate,
      invoiceEndDate,
    ]);
    if (invoicesFetchedRef.current === key) return;
    invoicesFetchedRef.current = key;
    fetchInvoices();
  }, [
    mainWarehouseId,
    partnerId,
    invoicesPage,
    invoiceStatus,
    invoicePaymentStatus,
    invoiceStartDate,
    invoiceEndDate,
  ]);

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await apiLocationPayment.getFilterPayerReceiverIDs(
        mainWarehouseId,
        partnerId,
        paymentsPage,
      );
      const records = res?.data?.data?.records ?? [];
      setPayments(records);
      setPaymentsPagination(res?.data?.data?.pagination ?? null);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "To'lovlarni yuklashda xatolik",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (!mainWarehouseId || !partnerId) return;
    const key = `${mainWarehouseId}-${partnerId}-${paymentsPage}`;
    if (paymentsFetchedRef.current === key) return;
    paymentsFetchedRef.current = key;
    fetchPayments();
  }, [mainWarehouseId, partnerId, paymentsPage]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";

  const formatPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("998")) {
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
    }
    return phone;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      paid: { colorScheme: "green", text: "To'langan" },
      unpaid: { colorScheme: "red", text: "To'lanmagan" },
      partially_paid: { colorScheme: "orange", text: "Qisman to'langan" },
    };
    return statusMap[status] || { colorScheme: "gray", text: status };
  };

  // Item ichidagi sotib olish narxini turli maydon nomlari bilan
  // qo'llab-quvvatlash (purchasePrice asosiy, price fallback sifatida).
  const getItemPurchasePrice = (item) => {
    const val = item?.purchasePrice ?? item?.price;
    return val !== undefined && val !== null ? Number(val) : null;
  };

  const toggleSelectionMode = () => {
    if (selectionMode) setSelectedInvoices([]);
    setSelectionMode(!selectionMode);
  };

  const toggleInvoiceSelection = (invoice) => {
    if (invoice.paymentStatus === "paid") return;
    const isSelected = selectedInvoices.find((inv) => inv.id === invoice.id);
    if (isSelected) {
      setSelectedInvoices(
        selectedInvoices.filter((inv) => inv.id !== invoice.id),
      );
    } else {
      setSelectedInvoices([...selectedInvoices, invoice]);
    }
  };

  const removeSelectedInvoice = (invoiceId) => {
    setSelectedInvoices(selectedInvoices.filter((inv) => inv.id !== invoiceId));
  };

  const calculateSelectedTotal = () =>
    selectedInvoices.reduce((sum, inv) => sum + Number(inv.totalSum), 0);

  const openGeneralPayment = async () => {
    setPaymentData({
      amount: partner?.balance > 0 ? partner?.balance : "",
      methodId: "",
      cashId: "",
      note: "",
    });
    onGeneralPaymentOpen();
    setLoadingPaymentOptions(true);
    try {
      const [methodsRes, cashRes] = await Promise.all([
        apiPayMethods.getAll(),
        apiCashs.getAll(),
      ]);
      setPaymentMethods(
        methodsRes.data.payMethods.filter(
          (m) => m.locationId === mainWarehouseId,
        ),
      );
      setCashboxes(
        cashRes.data.filter((c) => c.locationId === mainWarehouseId),
      );
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "To'lov ma'lumotlarini yuklashda xatolik",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingPaymentOptions(false);
    }
  };

  const openInvoicePayment = async () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "Ogohlantirish",
        description: "Kamida 1 ta invoice tanlang",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setPaymentData({
      amount: calculateSelectedTotal().toString(),
      methodId: "",
      cashId: "",
      note: "",
    });
    onInvoicePaymentOpen();
    setLoadingPaymentOptions(true);
    try {
      const [methodsRes, cashRes] = await Promise.all([
        apiPayMethods.getAll(),
        apiCashs.getAll(),
      ]);
      setPaymentMethods(
        methodsRes.data.payMethods.filter(
          (m) => m.locationId === mainWarehouseId,
        ),
      );
      setCashboxes(
        cashRes.data.filter((c) => c.locationId === mainWarehouseId),
      );
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "To'lov ma'lumotlarini yuklashda xatolik",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingPaymentOptions(false);
    }
  };

  const handleGeneralPayment = async (e) => {
    e.preventDefault();
    if (!paymentData.amount || !paymentData.methodId || !paymentData.cashId) {
      toast({
        title: "Xatolik",
        description: "Barcha majburiy maydonlarni to'ldiring",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setFormLoading({ ...formLoading, generalPay: true });
    try {
      await apiLocationPayment.Add({
        amount: Number(paymentData.amount),
        methodId: paymentData.methodId,
        status: "confirmed",
        cashId: paymentData.cashId,
        payerId: mainWarehouseId,
        receiverId: partnerId,
        note: paymentData.note,
        createdBy: userId,
      });
      onGeneralPaymentClose();
      setPaymentData({ amount: "", methodId: "", cashId: "", note: "" });
      fetchPartner();
      fetchPayments();
    } finally {
      setFormLoading({ ...formLoading, generalPay: false });
    }
  };

  const handleInvoicePayment = async (e) => {
    e.preventDefault();
    if (!paymentData.amount || !paymentData.methodId || !paymentData.cashId) {
      toast({
        title: "Xatolik",
        description: "Barcha majburiy maydonlarni to'ldiring",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setFormLoading({ ...formLoading, invPay: true });
    try {
      const invoicesPayload = selectedInvoices.map((inv) => ({
        invoiceId: inv.id,
      }));
      await apiLocationPayment.Add({
        amount: Number(paymentData.amount),
        methodId: paymentData.methodId,
        status: "confirmed",
        cashId: paymentData.cashId,
        payerId: mainWarehouseId,
        receiverId: partnerId,
        note: paymentData.note,
        createdBy: userId,
        invoices: invoicesPayload,
      });
      onInvoicePaymentClose();
      setPaymentData({ amount: "", methodId: "", cashId: "", note: "" });
      setSelectedInvoices([]);
      setSelectionMode(false);
      fetchPartner();
      fetchInvoices();
      fetchPayments();
    } finally {
      setFormLoading({ ...formLoading, invPay: false });
    }
  };

  const openInvoiceDetail = async (invoice) => {
    setSelectedInvoiceForDetail(invoice);
    setInvoiceItems([]);
    setInvoiceItemsPagination(null);
    setInvoiceItemsPage(1);
    onDetailOpen();
    await fetchInvoiceItems(invoice.id, 1);
  };

  const fetchInvoiceItems = async (invoiceId, page = 1) => {
    setLoadingInvoiceItems(true);
    try {
      const res = await apiInvoices.getByInvoiceId(invoiceId, page);
      setInvoiceItems(res?.data?.data?.records ?? []);
      setInvoiceItemsPagination(res?.data?.data?.pagination ?? null);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Tovar ma'lumotlarini yuklashda xatolik",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingInvoiceItems(false);
    }
  };

  const handleInvoiceItemsPageChange = (page) => {
    setInvoiceItemsPage(page);
    if (selectedInvoiceForDetail) {
      fetchInvoiceItems(selectedInvoiceForDetail.id, page);
    }
  };

  // Backend ba'zan "invoices", ba'zan "paymentInvoices" nomi bilan
  // qaytarishi mumkin, shuning uchun ikkalasini ham qo'llab-quvvatlaymiz.
  const getPaymentInvoiceList = (payment) =>
    payment?.invoices ?? payment?.paymentInvoices ?? [];

  // Har bir paymentInvoice ichida invNumber turlicha joylashgan bo'lishi
  // mumkin (inv.invoice.invNumber yoki bevosita inv.invNumber) — shu
  // sababli hammasini qo'llab-quvvatlaymiz.
  const getInvoiceDisplayNumber = (inv) =>
    inv?.invoice?.invNumber || inv?.invNumber || inv?.invoiceId;

  const openPaymentDetail = (payment) => {
    setSelectedPaymentForDetail(payment);
    onPaymentDetailOpen();
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
              <Text fontSize="lg" color={textSecondary}>
                Partner topilmadi
              </Text>
              <Button
                leftIcon={<ArrowLeft size={18} />}
                onClick={() => navigate("/ombor/taminotchilar")}
              >
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
      <Box
        bg={"bg"}
        borderBottom="1px"
        borderColor={"border"}
        px={{ base: 3, md: 6 }}
        py={4}
      >
        <Flex align="center" gap={4}>
          <IconButton
            aria-label="Orqaga"
            icon={<ArrowLeft size={20} />}
            variant="ghost"
            onClick={() => navigate("/ombor/taminotchilar")}
          />
          <Heading size={{ base: "md", md: "lg" }} color={textPrimary}>
            Taminotchi
          </Heading>
        </Flex>
      </Box>

      {/* Partner Info Hero */}
      <Box px={{ base: 3, md: 6 }} py={6}>
        <Card>
          <CardBody>
            <Flex direction={{ base: "column", md: "row" }} gap={6}>
              <Flex gap={4} align="start" flex={1}>
                <Avatar
                  size={{ base: "lg", md: "xl" }}
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

              <VStack align={{ base: "stretch", md: "end" }} spacing={4}>
                <Box textAlign={{ base: "left", md: "right" }}>
                  <Text fontSize="sm" color="textSecondary" mb={1}>
                    Joriy balans{" "}
                    {+partner?.balance > 0 ? "(bizning qarz)" : "(bizdan qarz)"}
                  </Text>
                  <Text
                    fontSize={{ base: "2xl", md: "3xl" }}
                    fontWeight="bold"
                    color={
                      Number(partner.balance) < 0
                        ? "red.500"
                        : Number(partner.balance) > 0
                          ? "green.500"
                          : "gray.600"
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
                  w={{ base: "full", md: "auto" }}
                >
                  To'lov qilish
                </Button>
              </VStack>
            </Flex>
          </CardBody>
        </Card>
      </Box>

      {/* Tabs */}
      <Box px={{ base: 3, md: 6 }}>
        <Tabs colorScheme="blue" variant="enclosed">
          <TabList overflowX="auto" flexWrap={{ base: "nowrap", md: "wrap" }}>
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
                    <Flex
                      gap={4}
                      direction={{ base: "column", md: "row" }}
                      wrap="wrap"
                    >
                      <FormControl maxW={{ md: "200px" }}>
                        <FormLabel fontSize="sm">Status</FormLabel>
                        <Select
                          value={invoiceStatus}
                          onChange={(e) => {
                            setInvoiceStatus(e.target.value);
                            setInvoicesPage(1);
                          }}
                          size="sm"
                        >
                          <option value="all">Barchasi</option>
                          <option value="received">Qabul qilingan</option>
                          <option value="cancelled">Bekor qilingan</option>
                        </Select>
                      </FormControl>

                      <FormControl maxW={{ md: "200px" }}>
                        <FormLabel fontSize="sm">To'lov holati</FormLabel>
                        <Select
                          value={invoicePaymentStatus}
                          onChange={(e) => {
                            setInvoicePaymentStatus(e.target.value);
                            setInvoicesPage(1);
                          }}
                          size="sm"
                        >
                          <option value="all">Barchasi</option>
                          <option value="paid">To'langan</option>
                          <option value="unpaid">To'lanmagan</option>
                          <option value="partially_paid">
                            Qisman to'langan
                          </option>
                        </Select>
                      </FormControl>

                      <FormControl maxW={{ md: "200px" }}>
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

                      <FormControl maxW={{ md: "200px" }}>
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

                    {!selectionMode ? (
                      <Button
                        leftIcon={<CheckCircle size={18} />}
                        colorScheme="blue"
                        variant="outline"
                        size="sm"
                        onClick={toggleSelectionMode}
                        w={{ base: "full", md: "fit-content" }}
                      >
                        Invoicelar uchun to'lov
                      </Button>
                    ) : (
                      <Box>
                        <Flex
                          p={4}
                          bg={selectionBg}
                          borderRadius="lg"
                          justify="space-between"
                          align="center"
                          direction={{ base: "column", md: "row" }}
                          gap={4}
                        >
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" color={textPrimary}>
                              {selectedInvoices.length} ta invoice tanlandi
                            </Text>
                            <Text
                              fontSize="lg"
                              fontWeight="semibold"
                              color="blue.600"
                            >
                              Jami: {formatCurrency(calculateSelectedTotal())}
                            </Text>
                          </VStack>
                          <HStack w={{ base: "full", md: "auto" }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={toggleSelectionMode}
                              flex={{ base: 1, md: "unset" }}
                            >
                              Bekor qilish
                            </Button>
                            <Button
                              colorScheme="green"
                              size="sm"
                              onClick={openInvoicePayment}
                              isDisabled={selectedInvoices.length === 0}
                              flex={{ base: 1, md: "unset" }}
                            >
                              To'lov qilish
                            </Button>
                          </HStack>
                        </Flex>

                        {selectedInvoices.length > 0 && (
                          <Wrap mt={3}>
                            {selectedInvoices.map((inv) => (
                              <WrapItem key={inv.id}>
                                <Tag
                                  size="md"
                                  borderRadius="full"
                                  variant="solid"
                                  colorScheme="blue"
                                >
                                  <TagLabel>{inv.invNumber}</TagLabel>
                                  <TagCloseButton
                                    onClick={() =>
                                      removeSelectedInvoice(inv.id)
                                    }
                                  />
                                </Tag>
                              </WrapItem>
                            ))}
                          </Wrap>
                        )}
                      </Box>
                    )}
                  </Stack>

                  <Divider my={4} />

                  {loadingInvoices ? (
                    <Flex justify="center" py={12}>
                      <Spinner size="xl" color="blue.500" thickness="4px" />
                    </Flex>
                  ) : invoices.length === 0 ? (
                    <VStack py={12} spacing={4}>
                      <Icon as={Package} boxSize={16} color="gray.400" />
                      <Text color={textSecondary} fontSize="lg">
                        Hozircha invoicelar yo'q
                      </Text>
                    </VStack>
                  ) : (
                    <>
                      {/* DESKTOP TABLE */}
                      <Box
                        overflowX="auto"
                        display={{ base: "none", md: "block" }}
                      >
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              {selectionMode && <Th w="50px"></Th>}
                              <Th>Invoice №</Th>
                              <Th>Summa</Th>
                              <Th>To'lov holati</Th>
                              {invoiceStatus === "cancelled" && <Th>Status</Th>}
                              <Th>Sana</Th>
                              <Th>Amallar</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {invoices.map((invoice) => (
                              <Tr key={invoice.id} _hover={{ bg: hoverBg }}>
                                {selectionMode && (
                                  <Td>
                                    <Checkbox
                                      isChecked={selectedInvoices.some(
                                        (inv) => inv.id === invoice.id,
                                      )}
                                      onChange={() =>
                                        toggleInvoiceSelection(invoice)
                                      }
                                      isDisabled={
                                        invoice.paymentStatus === "paid"
                                      }
                                    />
                                  </Td>
                                )}
                                <Td fontWeight="medium">{invoice.invNumber}</Td>
                                <Td fontWeight="semibold">
                                  {formatCurrency(invoice.totalSum)}
                                </Td>
                                <Td>
                                  <Badge
                                    {...getPaymentStatusBadge(
                                      invoice.paymentStatus,
                                    )}
                                  >
                                    {
                                      getPaymentStatusBadge(
                                        invoice.paymentStatus,
                                      ).text
                                    }
                                  </Badge>
                                </Td>
                                {invoiceStatus === "cancelled" && (
                                  <Td>
                                    <Badge colorScheme="gray">
                                      Bekor qilingan
                                    </Badge>
                                  </Td>
                                )}
                                <Td fontSize="sm" color={textSecondary}>
                                  {formatDate(invoice.createdAt)}
                                </Td>
                                <Td>
                                  <Button
                                    size="xs"
                                    borderRadius="7px"
                                    variant="outline"
                                    colorScheme="blue"
                                    onClick={() => openInvoiceDetail(invoice)}
                                  >
                                    Batafsil
                                  </Button>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>

                      {/* MOBILE CARD LIST */}
                      <VStack
                        spacing={3}
                        align="stretch"
                        display={{ base: "flex", md: "none" }}
                      >
                        {invoices.map((invoice) => (
                          <Box
                            key={invoice.id}
                            p={4}
                            borderRadius="lg"
                            border="1px solid"
                            borderColor={mobileCardBorder}
                            bg={mobileCardBg}
                          >
                            <Flex justify="space-between" align="start" mb={2}>
                              {selectionMode && (
                                <Checkbox
                                  mr={2}
                                  isChecked={selectedInvoices.some(
                                    (inv) => inv.id === invoice.id,
                                  )}
                                  onChange={() =>
                                    toggleInvoiceSelection(invoice)
                                  }
                                  isDisabled={invoice.paymentStatus === "paid"}
                                />
                              )}
                              <Text fontWeight="bold" fontSize="sm" flex={1}>
                                {invoice.invNumber}
                              </Text>
                              <Badge
                                {...getPaymentStatusBadge(
                                  invoice.paymentStatus,
                                )}
                              >
                                {
                                  getPaymentStatusBadge(invoice.paymentStatus)
                                    .text
                                }
                              </Badge>
                            </Flex>
                            <Flex justify="space-between" align="center" mb={1}>
                              <Text fontSize="sm" color={textSecondary}>
                                Summa
                              </Text>
                              <Text fontWeight="semibold">
                                {formatCurrency(invoice.totalSum)}
                              </Text>
                            </Flex>
                            <Flex justify="space-between" align="center" mb={3}>
                              <Text fontSize="sm" color={textSecondary}>
                                Sana
                              </Text>
                              <Text fontSize="sm" color={textSecondary}>
                                {formatDate(invoice.createdAt)}
                              </Text>
                            </Flex>
                            {invoiceStatus === "cancelled" && (
                              <Badge colorScheme="gray" mb={2}>
                                Bekor qilingan
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              w="full"
                              variant="outline"
                              colorScheme="blue"
                              onClick={() => openInvoiceDetail(invoice)}
                            >
                              Batafsil
                            </Button>
                          </Box>
                        ))}
                      </VStack>
                    </>
                  )}

                  {invoicesPagination && invoicesPagination.total_pages > 1 && (
                    <Flex
                      mt={4}
                      justify="space-between"
                      align="center"
                      wrap="wrap"
                      gap={2}
                    >
                      <Text fontSize="sm" color={textSecondary}>
                        Sahifa {invoicesPagination.currentPage} /{" "}
                        {invoicesPagination.total_pages}
                      </Text>
                      <HStack spacing={2} overflowX="auto">
                        <IconButton
                          aria-label="Previous"
                          icon={<ChevronLeft size={20} />}
                          onClick={() => setInvoicesPage((p) => p - 1)}
                          isDisabled={invoicesPagination.currentPage === 1}
                          variant="outline"
                          size="sm"
                        />
                        {[...Array(invoicesPagination.total_pages)].map(
                          (_, i) => (
                            <Button
                              key={i}
                              onClick={() => setInvoicesPage(i + 1)}
                              colorScheme={
                                invoicesPagination.currentPage === i + 1
                                  ? "blue"
                                  : "gray"
                              }
                              variant={
                                invoicesPagination.currentPage === i + 1
                                  ? "solid"
                                  : "outline"
                              }
                              size="sm"
                            >
                              {i + 1}
                            </Button>
                          ),
                        )}
                        <IconButton
                          aria-label="Next"
                          icon={<ChevronRight size={20} />}
                          onClick={() => setInvoicesPage((p) => p + 1)}
                          isDisabled={
                            invoicesPagination.currentPage ===
                            invoicesPagination.total_pages
                          }
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
                      <Text color={textSecondary} fontSize="lg">
                        To'lovlar tarixi bo'sh
                      </Text>
                      <Text color={textSecondary} fontSize="sm">
                        Birinchi to'lovni amalga oshiring
                      </Text>
                    </VStack>
                  ) : (
                    <>
                      {/* DESKTOP TABLE */}
                      <Box
                        overflowX="auto"
                        display={{ base: "none", md: "block" }}
                      >
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
                              <Th>Amallar</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {payments.map((payment) => (
                              <Tr key={payment.id} _hover={{ bg: hoverBg }}>
                                <Td>
                                  <Text
                                    fontWeight="bold"
                                    fontSize="lg"
                                    color="green.500"
                                  >
                                    {formatCurrency(payment.amount)}
                                  </Text>
                                </Td>
                                <Td>{payment.cash?.name || "-"}</Td>
                                <Td>
                                  <Badge colorScheme="blue">
                                    {payment.method?.name || "-"}
                                  </Badge>
                                </Td>
                                <Td fontSize="sm">
                                  {payment.created?.full_name || "-"}
                                </Td>
                                <Td>
                                  {getPaymentInvoiceList(payment).length > 0 ? (
                                    <Badge colorScheme="purple">
                                      {getPaymentInvoiceList(payment).length} ta
                                      invoice
                                    </Badge>
                                  ) : (
                                    <Text fontSize="sm" color={textSecondary}>
                                      Umumiy to'lov
                                    </Text>
                                  )}
                                </Td>
                                <Td
                                  fontSize="sm"
                                  color={textSecondary}
                                  maxW="200px"
                                  isTruncated
                                >
                                  {payment.note || "-"}
                                </Td>
                                <Td fontSize="sm" color={textSecondary}>
                                  {formatDate(payment.createdAt)}
                                </Td>
                                <Td>
                                  <Button
                                    size="xs"
                                    borderRadius="7px"
                                    variant="outline"
                                    colorScheme="blue"
                                    onClick={() => openPaymentDetail(payment)}
                                  >
                                    Batafsil
                                  </Button>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>

                      {/* MOBILE CARD LIST */}
                      <VStack
                        spacing={3}
                        align="stretch"
                        display={{ base: "flex", md: "none" }}
                      >
                        {payments.map((payment) => (
                          <Box
                            key={payment.id}
                            p={4}
                            borderRadius="lg"
                            border="1px solid"
                            borderColor={mobileCardBorder}
                            bg={mobileCardBg}
                          >
                            <Flex justify="space-between" align="center" mb={2}>
                              <Text
                                fontWeight="bold"
                                fontSize="lg"
                                color="green.500"
                              >
                                {formatCurrency(payment.amount)}
                              </Text>
                              <Badge colorScheme="blue">
                                {payment.method?.name || "-"}
                              </Badge>
                            </Flex>
                            <Flex
                              justify="space-between"
                              fontSize="sm"
                              color={textSecondary}
                              mb={1}
                            >
                              <Text>Kassa</Text>
                              <Text>{payment.cash?.name || "-"}</Text>
                            </Flex>
                            <Flex
                              justify="space-between"
                              fontSize="sm"
                              color={textSecondary}
                              mb={1}
                            >
                              <Text>Kim tomonidan</Text>
                              <Text>{payment.created?.full_name || "-"}</Text>
                            </Flex>
                            <Flex
                              justify="space-between"
                              fontSize="sm"
                              color={textSecondary}
                              mb={1}
                            >
                              <Text>Invoicelar</Text>
                              {getPaymentInvoiceList(payment).length > 0 ? (
                                <Badge colorScheme="purple">
                                  {getPaymentInvoiceList(payment).length} ta
                                  invoice
                                </Badge>
                              ) : (
                                <Text>Umumiy to'lov</Text>
                              )}
                            </Flex>
                            {payment.note && (
                              <Text fontSize="sm" color={textSecondary} mb={1}>
                                Izoh: {payment.note}
                              </Text>
                            )}
                            <Text fontSize="xs" color={textSecondary} mt={2}>
                              {formatDate(payment.createdAt)}
                            </Text>
                            <Button
                              size="sm"
                              w="full"
                              mt={3}
                              variant="outline"
                              colorScheme="blue"
                              onClick={() => openPaymentDetail(payment)}
                            >
                              Batafsil
                            </Button>
                          </Box>
                        ))}
                      </VStack>
                    </>
                  )}

                  {paymentsPagination && paymentsPagination.totalPages > 1 && (
                    <Flex
                      mt={4}
                      justify="space-between"
                      align="center"
                      wrap="wrap"
                      gap={2}
                    >
                      <Text fontSize="sm" color={textSecondary}>
                        Sahifa {paymentsPagination.currentPage} /{" "}
                        {paymentsPagination.totalPages}
                      </Text>
                      <HStack spacing={2} overflowX="auto">
                        <IconButton
                          aria-label="Previous"
                          icon={<ChevronLeft size={20} />}
                          onClick={() => setPaymentsPage((p) => p - 1)}
                          isDisabled={paymentsPagination.currentPage === 1}
                          variant="outline"
                          size="sm"
                        />
                        {[...Array(paymentsPagination.totalPages)].map(
                          (_, i) => (
                            <Button
                              key={i}
                              onClick={() => setPaymentsPage(i + 1)}
                              colorScheme={
                                paymentsPagination.currentPage === i + 1
                                  ? "blue"
                                  : "gray"
                              }
                              variant={
                                paymentsPagination.currentPage === i + 1
                                  ? "solid"
                                  : "outline"
                              }
                              size="sm"
                            >
                              {i + 1}
                            </Button>
                          ),
                        )}
                        <IconButton
                          aria-label="Next"
                          icon={<ChevronRight size={20} />}
                          onClick={() => setPaymentsPage((p) => p + 1)}
                          isDisabled={
                            paymentsPagination.currentPage ===
                            paymentsPagination.totalPages
                          }
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
      <Modal
        isOpen={isGeneralPaymentOpen}
        onClose={onGeneralPaymentClose}
        size={{ base: "full", md: "md" }}
        isCentered
        scrollBehavior="inside"
      >
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
                        Number(partner.balance) < 0
                          ? "red.500"
                          : Number(partner.balance) > 0
                            ? "green.500"
                            : "gray.600"
                      }
                    >
                      {formatCurrency(partner.balance)}
                    </Text>
                  </Box>

                  <FormControl isRequired>
                    <FormLabel>To'lov summasi</FormLabel>
                    <NumberInput
                      value={paymentData.amount}
                      onChange={(value) =>
                        setPaymentData({ ...paymentData, amount: value })
                      }
                      min={0}
                    >
                      <NumberInputField placeholder="Summa" />
                    </NumberInput>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>To'lov usuli</FormLabel>
                    <Select
                      value={paymentData.methodId}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          methodId: e.target.value,
                        })
                      }
                      placeholder="To'lov usulini tanlang"
                    >
                      {paymentMethods.map((method) => (
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
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          cashId: e.target.value,
                        })
                      }
                      placeholder="Kassani tanlang"
                    >
                      {cashboxes.map((cash) => (
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
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, note: e.target.value })
                      }
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
              <Button
                isLoading={formLoading.generalPay}
                loadingText="Saqlanmoqda..."
                colorScheme="green"
                type="submit"
              >
                To'lash
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Invoice Payment Modal */}
      <Modal
        isOpen={isInvoicePaymentOpen}
        onClose={onInvoicePaymentClose}
        size={{ base: "full", md: "md" }}
        isCentered
        scrollBehavior="inside"
      >
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
                  <Box>
                    <Text fontWeight="semibold" mb={2}>
                      Tanlangan invoicelar ({selectedInvoices.length})
                    </Text>
                    <VStack
                      align="stretch"
                      spacing={2}
                      maxH="200px"
                      overflowY="auto"
                      p={3}
                      bg={bgAlt}
                      borderRadius="md"
                    >
                      {selectedInvoices.map((inv) => (
                        <Flex
                          key={inv.id}
                          justify="space-between"
                          align="center"
                        >
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
                      onChange={(value) =>
                        setPaymentData({ ...paymentData, amount: value })
                      }
                      min={0}
                    >
                      <NumberInputField placeholder="Summa" />
                    </NumberInput>
                    {Number(paymentData.amount) !==
                      calculateSelectedTotal() && (
                      <Alert
                        status={
                          Number(paymentData.amount) > calculateSelectedTotal()
                            ? "warning"
                            : "info"
                        }
                        mt={2}
                        borderRadius="md"
                      >
                        <AlertIcon />
                        <AlertDescription fontSize="sm">
                          {Number(paymentData.amount) > calculateSelectedTotal()
                            ? `Ortiqcha: +${formatCurrency(Number(paymentData.amount) - calculateSelectedTotal())}`
                            : `Kam: ${formatCurrency(calculateSelectedTotal() - Number(paymentData.amount))}`}
                        </AlertDescription>
                      </Alert>
                    )}
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>To'lov usuli</FormLabel>
                    <Select
                      value={paymentData.methodId}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          methodId: e.target.value,
                        })
                      }
                      placeholder="To'lov usulini tanlang"
                    >
                      {paymentMethods.map((method) => (
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
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          cashId: e.target.value,
                        })
                      }
                      placeholder="Kassani tanlang"
                    >
                      {cashboxes.map((cash) => (
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
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, note: e.target.value })
                      }
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
              <Button
                isLoading={formLoading.invPay}
                loadingText="Saqlanmoqda..."
                colorScheme="green"
                type="submit"
              >
                To'lash {formatCurrency(Number(paymentData.amount) || 0)}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Invoice Detail (Batafsil) Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={onDetailClose}
        size={{ base: "full", md: "4xl" }}
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader borderBottomWidth="1px">
            <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
              <VStack align="start" spacing={1}>
                <Text>Invoice tafsilotlari</Text>
                {selectedInvoiceForDetail && (
                  <Text fontSize="sm" fontWeight="normal" color={textSecondary}>
                    {selectedInvoiceForDetail.invNumber}
                  </Text>
                )}
              </VStack>
              {selectedInvoiceForDetail && (
                <HStack spacing={2}>
                  <Badge colorScheme="blue">Kirim</Badge>
                  <Badge
                    colorScheme={
                      STATUS_COLORS[selectedInvoiceForDetail.status] || "gray"
                    }
                  >
                    {STATUS_LABELS[selectedInvoiceForDetail.status] ||
                      selectedInvoiceForDetail.status}
                  </Badge>
                </HStack>
              )}
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            {loadingInvoiceItems && invoiceItems.length === 0 ? (
              <Stack spacing={4}>
                <SkeletonText noOfLines={4} spacing="4" />
                <SkeletonText noOfLines={4} spacing="4" />
              </Stack>
            ) : selectedInvoiceForDetail ? (
              <VStack align="stretch" spacing={4}>
                {/* INFO CARDS */}
                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                  gap={4}
                >
                  <Card variant="outline">
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <Text fontSize="xs" color={textSecondary}>
                          Sana va vaqt
                        </Text>
                        <Text fontWeight="medium">
                          {formatDateTime(selectedInvoiceForDetail.createdAt)}
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card variant="outline">
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <Text fontSize="xs" color={textSecondary}>
                          To'lov holati
                        </Text>
                        <Badge
                          colorScheme={
                            PAYMENT_COLORS[
                              selectedInvoiceForDetail.paymentStatus
                            ] || "gray"
                          }
                        >
                          {PAYMENT_LABELS[
                            selectedInvoiceForDetail.paymentStatus
                          ] || selectedInvoiceForDetail.paymentStatus}
                        </Badge>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card variant="outline">
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <Text fontSize="xs" color={textSecondary}>
                          Jo'natuvchi
                        </Text>
                        <Text fontWeight="medium">{partner?.name || "—"}</Text>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card variant="outline">
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <Text fontSize="xs" color={textSecondary}>
                          Qabul qiluvchi
                        </Text>
                        <Text fontWeight="medium">Bizning ombor</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </Grid>

                <Divider />

                {/* ITEMS TABLE */}
                <Box>
                  <Text fontWeight="bold" mb={3}>
                    Mahsulotlar
                  </Text>

                  {invoiceItems.length === 0 ? (
                    <VStack py={12} spacing={4}>
                      <Icon as={Package} boxSize={16} color="gray.400" />
                      <Text color={textSecondary}>Tovarlar topilmadi</Text>
                    </VStack>
                  ) : (
                    <>
                      {/* DESKTOP TABLE */}
                      <Box
                        overflowX="auto"
                        display={{ base: "none", md: "block" }}
                      >
                        <Table size="sm" variant="simple">
                          <Thead>
                            <Tr>
                              <Th>#</Th>
                              <Th>Mahsulot</Th>
                              <Th>Birlik</Th>
                              <Th isNumeric>Narx</Th>
                              <Th isNumeric>Miqdor</Th>
                              <Th isNumeric>Jami</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {invoiceItems.map((item, index) => {
                              const purchasePrice = getItemPurchasePrice(item);
                              const rowTotal =
                                purchasePrice !== null
                                  ? purchasePrice * Number(item.quantity || 0)
                                  : null;
                              return (
                                <Tr key={item.id}>
                                  <Td>{index + 1}</Td>
                                  <Td fontWeight="medium">
                                    {item.product?.name || "-"}
                                  </Td>
                                  <Td>{item.product?.unit || "-"}</Td>
                                  <Td isNumeric>
                                    {purchasePrice !== null
                                      ? formatNumber(purchasePrice)
                                      : "-"}
                                  </Td>
                                  <Td isNumeric>{item.quantity}</Td>
                                  <Td isNumeric fontWeight="bold">
                                    {rowTotal !== null
                                      ? formatNumber(rowTotal)
                                      : "-"}
                                  </Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      </Box>

                      {/* MOBILE CARD LIST */}
                      <VStack
                        spacing={2}
                        align="stretch"
                        display={{ base: "flex", md: "none" }}
                      >
                        {invoiceItems.map((item, index) => {
                          const purchasePrice = getItemPurchasePrice(item);
                          const rowTotal =
                            purchasePrice !== null
                              ? purchasePrice * Number(item.quantity || 0)
                              : null;
                          return (
                            <Box
                              key={item.id}
                              p={3}
                              borderRadius="md"
                              border="1px solid"
                              borderColor={mobileCardBorder}
                            >
                              <Text fontWeight="medium" fontSize="sm" mb={1}>
                                {index + 1}. {item.product?.name || "-"}
                              </Text>
                              <Flex
                                justify="space-between"
                                fontSize="sm"
                                color={textSecondary}
                                mb={1}
                              >
                                <Text>Birlik: {item.product?.unit || "-"}</Text>
                                <Text>
                                  Narxi:{" "}
                                  {purchasePrice !== null
                                    ? formatNumber(purchasePrice)
                                    : "-"}
                                </Text>
                              </Flex>
                              <Flex justify="space-between" fontSize="sm">
                                <Text color={textSecondary}>
                                  Miqdor: {item.quantity}
                                </Text>
                                <Text fontWeight="semibold">
                                  Jami:{" "}
                                  {rowTotal !== null
                                    ? formatNumber(rowTotal)
                                    : "-"}
                                </Text>
                              </Flex>
                            </Box>
                          );
                        })}
                      </VStack>
                    </>
                  )}

                  {invoiceItemsPagination &&
                    invoiceItemsPagination.total_pages > 1 && (
                      <Flex mt={4} justify="space-between" align="center">
                        <Text fontSize="sm" color={textSecondary}>
                          Sahifa {invoiceItemsPagination.currentPage} /{" "}
                          {invoiceItemsPagination.total_pages}
                        </Text>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Previous"
                            icon={<ChevronLeft size={20} />}
                            onClick={() =>
                              handleInvoiceItemsPageChange(invoiceItemsPage - 1)
                            }
                            isDisabled={
                              invoiceItemsPagination.currentPage === 1
                            }
                            variant="outline"
                            size="sm"
                          />
                          <IconButton
                            aria-label="Next"
                            icon={<ChevronRight size={20} />}
                            onClick={() =>
                              handleInvoiceItemsPageChange(invoiceItemsPage + 1)
                            }
                            isDisabled={
                              invoiceItemsPagination.currentPage ===
                              invoiceItemsPagination.total_pages
                            }
                            variant="outline"
                            size="sm"
                          />
                        </HStack>
                      </Flex>
                    )}
                </Box>

                <Divider />

                {/* SUMMARY */}
                <Card variant="outline" bg={selectionBg}>
                  <CardBody>
                    <Flex justify="space-between" fontSize="lg">
                      <Text fontWeight="bold">Jami:</Text>
                      <Text fontWeight="bold" color="blue.500">
                        {formatCurrency(selectedInvoiceForDetail.totalSum)}
                      </Text>
                    </Flex>
                  </CardBody>
                </Card>
              </VStack>
            ) : null}
          </ModalBody>
          <ModalFooter borderTopWidth="1px">
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onDetailClose}>
                Yopish
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                Chop etish
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Payment Detail (Batafsil) Modal - to'lov qaysi invoicelarga sarflangani */}
      <Modal
        isOpen={isPaymentDetailOpen}
        onClose={onPaymentDetailClose}
        size={{ base: "full", md: "xl" }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            To'lov tafsilotlari
            {selectedPaymentForDetail && (
              <Text fontSize="sm" fontWeight="normal" color={textSecondary}>
                {formatDate(selectedPaymentForDetail.createdAt)}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPaymentForDetail && (
              <>
                <Stack spacing={3} mb={4}>
                  <Flex
                    justify="space-between"
                    align="center"
                    p={3}
                    bg={bgAlt}
                    borderRadius="md"
                  >
                    <Text fontSize="sm" color={textSecondary}>
                      To'lov summasi
                    </Text>
                    <Text fontWeight="bold" fontSize="lg" color="green.500">
                      {formatCurrency(selectedPaymentForDetail.amount)}
                    </Text>
                  </Flex>

                  <Flex
                    direction={{ base: "column", md: "row" }}
                    gap={3}
                    wrap="wrap"
                  >
                    <Box flex={1} minW="140px">
                      <Text fontSize="xs" color={textSecondary} mb={1}>
                        Kassa
                      </Text>
                      <Text fontWeight="medium">
                        {selectedPaymentForDetail.cash?.name || "-"}
                      </Text>
                    </Box>
                    <Box flex={1} minW="140px">
                      <Text fontSize="xs" color={textSecondary} mb={1}>
                        To'lov usuli
                      </Text>
                      <Badge colorScheme="blue">
                        {selectedPaymentForDetail.method?.name || "-"}
                      </Badge>
                    </Box>
                    <Box flex={1} minW="140px">
                      <Text fontSize="xs" color={textSecondary} mb={1}>
                        Kim tomonidan
                      </Text>
                      <Text fontWeight="medium">
                        {selectedPaymentForDetail.created?.full_name || "-"}
                      </Text>
                    </Box>
                  </Flex>

                  {selectedPaymentForDetail.note && (
                    <Box>
                      <Text fontSize="xs" color={textSecondary} mb={1}>
                        Izoh
                      </Text>
                      <Text fontSize="sm">{selectedPaymentForDetail.note}</Text>
                    </Box>
                  )}
                </Stack>

                <Divider mb={4} />

                <Text fontWeight="semibold" mb={3}>
                  Sarflangan invoicelar (
                  {getPaymentInvoiceList(selectedPaymentForDetail).length})
                </Text>

                {getPaymentInvoiceList(selectedPaymentForDetail).length ===
                0 ? (
                  <VStack py={8} spacing={3}>
                    <Icon as={Receipt} boxSize={12} color="gray.400" />
                    <Text color={textSecondary} fontSize="sm">
                      Bu umumiy to'lov, aniq invoicega bog'lanmagan
                    </Text>
                  </VStack>
                ) : (
                  <>
                    {/* DESKTOP TABLE */}
                    <Box
                      overflowX="auto"
                      overflowY="auto"
                      maxH="220px"
                      display={{ base: "none", md: "block" }}
                    >
                      <Table variant="simple" size="sm">
                        <Thead
                          position="sticky"
                          top={0}
                          bg={mobileCardBg}
                          zIndex={1}
                        >
                          <Tr>
                            <Th>Invoice</Th>
                            <Th isNumeric>Sarflangan summa</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {getPaymentInvoiceList(selectedPaymentForDetail).map(
                            (inv) => (
                              <Tr key={inv.id || inv.invoiceId}>
                                <Td fontWeight="medium">
                                  {getInvoiceDisplayNumber(inv)}
                                </Td>
                                <Td isNumeric fontWeight="semibold">
                                  {formatCurrency(inv.amount)}
                                </Td>
                              </Tr>
                            ),
                          )}
                        </Tbody>
                      </Table>
                    </Box>

                    {/* MOBILE CARD LIST */}
                    <VStack
                      spacing={2}
                      align="stretch"
                      maxH="260px"
                      overflowY="auto"
                      display={{ base: "flex", md: "none" }}
                    >
                      {getPaymentInvoiceList(selectedPaymentForDetail).map(
                        (inv) => (
                          <Flex
                            key={inv.id || inv.invoiceId}
                            justify="space-between"
                            align="center"
                            p={3}
                            borderRadius="md"
                            border="1px solid"
                            borderColor={mobileCardBorder}
                          >
                            <Text fontSize="sm" fontWeight="medium">
                              {getInvoiceDisplayNumber(inv)}
                            </Text>
                            <Text fontSize="sm" fontWeight="semibold">
                              {formatCurrency(inv.amount)}
                            </Text>
                          </Flex>
                        ),
                      )}
                    </VStack>

                    <Divider my={4} />
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="bold">Jami:</Text>
                      <Text fontWeight="bold" fontSize="lg" color="blue.500">
                        {formatCurrency(
                          getPaymentInvoiceList(
                            selectedPaymentForDetail,
                          ).reduce(
                            (sum, inv) => sum + Number(inv.amount || 0),
                            0,
                          ),
                        )}
                      </Text>
                    </Flex>
                  </>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PartnerDetailPage;
