import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Button,
  Select,
  Input,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Text,
  Badge,
  useDisclosure,
  HStack,
  VStack,
  useToast,
  NumberInput,
  NumberInputField,
  useColorModeValue,
  ButtonGroup,
  Textarea,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, MinusIcon } from "@chakra-ui/icons";
import { apiCashs } from "../../../utils/Controllers/apiCashs";
import { apiPayMethods } from "../../../utils/Controllers/apiPayMethods";
import { apiPayment } from "../../../utils/Controllers/apiPayment";
import Cookies from "js-cookie";
import ProductModal from "./__components/ProductModal";
import Receiptmodal from "./__components/Receiptmodal";
import Editsummodal from "./__components/Editsummodal";
import { useWarehouseStore } from "../../../store/useWarehouseStore";

export default function OrderCreate() {
  const [orderItems, setOrderItems] = useState([]);

  const [orderType, setOrderType] = useState("sale");
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [savedOrderItems, setSavedOrderItems] = useState([]);
  const [currentPaymentId, setCurrentPaymentId] = useState(null);
  const [tableNumber, setTableNumber] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const { cafeWarehouseId } = useWarehouseStore();

  const [orderData, setOrder] = useState();
  // const cafeWarehouseId = "ced7a9cd-7af2-4c3d-89c4-0299ae9fd9be"

  const sidebar = useDisclosure();
  const receipt = useDisclosure();
  const editSumModal = useDisclosure();
  const toast = useToast();

  // ─── Dark mode ranglar ───
  const bgPage = useColorModeValue("gray.50", "gray.900");
  const bgCard = useColorModeValue("white", "gray.800");
  const bgTableHead = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textMuted = useColorModeValue("gray.500", "gray.400");
  const textPrimary = useColorModeValue("gray.800", "gray.100");
  const accentColor = useColorModeValue("blue.600", "blue.300");
  const inputBg = useColorModeValue("white", "gray.700");

  // ─── Mahsulotni buyurtmaga qo'shish ───
  const addItem = (product) => {
    setOrderItems((prev) => {
      const exists = prev.find((item) => item.productId === product.id);
      if (exists) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, count: item.count + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: parseFloat(product.price),
          count: 1,
        },
      ];
    });

    toast({
      title: `${product.name} qo'shildi`,
      status: "success",
      duration: 1000,
      isClosable: true,
      position: "top-right",
    });
  };

  // ─── Summani tahrirlash ───
  const handleEditSum = async (paymentId, data) => {
    try {
      // const data = { receivedSum: sum };
      const response = await apiPayment.EditSum(paymentId, data);

      // Yangilangan payment ma'lumotlarini saqlash
      if (response.data?.payment) {
        setPaymentData(response.data.payment);
      }

      return response;
    } finally {
    }
  };

  // ─── Sonini o'zgartirish ───
  const updateCount = (productId, newCount) => {
    if (newCount < 1) {
      removeItem(productId);
      return;
    }
    setOrderItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, count: newCount } : item,
      ),
    );
  };

  // ─── O'chirish ───
  const removeItem = (productId) => {
    setOrderItems((prev) =>
      prev.filter((item) => item.productId !== productId),
    );
  };

  // ─── Jami summa ───
  const totalSum = orderItems.reduce(
    (sum, item) => sum + item.price * item.count,
    0,
  );

  // ─── Stol raqami endi harf+raqam bo'lishi mumkin ───
  const isTableNumberValid = tableNumber.trim() !== "";

  // ─── Buyurtma yaratish ───
  const createOrder = async () => {
    // if (!selectedCash) {
    //     toast({ title: "Kassani tanlang", status: "warning", duration: 2000 });
    //     return;
    // }
    // if (!selectedPayMethod) {
    //     toast({
    //         title: "To'lov usulini tanlang",
    //         status: "warning",
    //         duration: 2000,
    //     });
    //     return;
    // }
    if (orderItems.length === 0) {
      toast({
        title: "Kamida bitta mahsulot qo'shing",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    const orderData = {
      type: orderType,
      locationId: cafeWarehouseId,
      // cashId: selectedCash,
      // payMethodId: selectedPayMethod,
      orderStatus: "completed",
      createdBy: Cookies.get("user_id"),
      ...(isTableNumberValid ? { tableNumber: tableNumber.trim() } : {}),
      ...(orderNote.trim() ? { note: orderNote.trim() } : {}),
      items: orderItems.map((item) => ({
        productId: item.productId,
        count: item.count,
        price: item.price,
      })),
    };

    try {
      setLoading(true);
      const response = await apiPayment.Create(orderData);

      const payment = response.data?.payment || response.payment;
      const paymentId = payment?.id || response.data?.id || response.id;

      // Saqlash payment ma'lumotlarini
      setPaymentData(payment);
      setCurrentPaymentId(paymentId);
      setSavedOrderItems([...orderItems]);

      toast({
        title: "Buyurtma yaratildi!",
        status: "success",
        duration: 3000,
      });
      setOrder(response?.data);
      // Tozalash
      setOrderItems([]);
      setOrderType("sale");
      setTableNumber("");
      setOrderNote("");

      // Chekni ochish
      receipt.onOpen();
    } catch (error) {
      toast({ title: "Xatolik yuz berdi", status: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // ─── Narxni formatlash ───
  const formatPrice = (price) =>
    Number(price).toLocaleString("uz-UZ") + " so'm";

  return (
    <Box bg={bgPage} minH="100vh" p={{ base: 4, md: 6 }}>
      {/* HEADER */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color={textPrimary}>
          Yangi buyurtma
        </Heading>
        <Button
          colorScheme="blue"
          onClick={sidebar.onOpen}
          leftIcon={<AddIcon />}
        >
          Mahsulotlar
        </Button>
      </Flex>

      {/* TYPE TANLASH */}
      <Box mb={5}>
        <Text fontSize="sm" color={textMuted} mb={2}>
          Buyurtma turi
        </Text>
        <ButtonGroup isAttached variant="outline" size="sm">
          <Button
            colorScheme="blue"
            variant={orderType === "sale" ? "solid" : "outline"}
            onClick={() => setOrderType("sale")}
          >
            Sotuv
          </Button>
          <Button
            colorScheme="orange"
            variant={orderType === "disposal" ? "solid" : "outline"}
            onClick={() => setOrderType("disposal")}
          >
            Utilizatsiya
          </Button>
        </ButtonGroup>
      </Box>

      {/* META MA'LUMOTLAR */}
      {/* <Stack direction={{ base: "column", md: "row" }} spacing={4} mb={6}>
                <Select
                    placeholder="Kassani tanlang"
                    maxW="300px"
                    bg={inputBg}
                    borderColor={borderColor}
                    color={textPrimary}
                    value={selectedCash}
                    onChange={(e) => setSelectedCash(e.target.value)}
                >
                    {cashs.map((cash) => (
                        <option key={cash.id} value={cash.id}>
                            {cash.name}
                        </option>
                    ))}
                </Select>

                <Select
                    placeholder="To'lov usuli"
                    maxW="300px"
                    bg={inputBg}
                    borderColor={borderColor}
                    color={textPrimary}
                    value={selectedPayMethod}
                    onChange={(e) => setSelectedPayMethod(e.target.value)}
                >
                    {payMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                            {method.name}
                        </option>
                    ))}
                </Select>

                <Input
                    type="datetime-local"
                    defaultValue={new Date().toISOString().slice(0, 16)}
                    maxW="260px"
                    bg={inputBg}
                    borderColor={borderColor}
                    color={textPrimary}
                    isReadOnly
                />
            </Stack> */}

      {/* BUYURTMA JADVALI */}
      <Box
        bg={bgCard}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        mb={6}
      >
        <Table variant="simple" size="md">
          <Thead bg={bgTableHead}>
            <Tr>
              <Th color={textMuted}>#</Th>
              <Th color={textMuted}>Mahsulot</Th>
              <Th color={textMuted} isNumeric>
                Narx
              </Th>
              <Th color={textMuted} isNumeric>
                Soni
              </Th>
              <Th color={textMuted} isNumeric>
                Jami
              </Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {orderItems.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center" py={10} color={textMuted}>
                  Mahsulot qo'shilmagan. "Mahsulotlar" tugmasini bosing.
                </Td>
              </Tr>
            ) : (
              orderItems.map((item, index) => (
                <Tr key={item.productId}>
                  <Td color={textPrimary}>{index + 1}</Td>
                  <Td fontWeight="medium" color={textPrimary}>
                    {item.name}
                  </Td>
                  <Td isNumeric color={textPrimary}>
                    {formatPrice(item.price)}
                  </Td>
                  <Td isNumeric>
                    <HStack justify="flex-end" spacing={1}>
                      <IconButton
                        size="xs"
                        icon={<MinusIcon />}
                        onClick={() =>
                          updateCount(item.productId, item.count - 1)
                        }
                        variant="outline"
                        borderColor={borderColor}
                        color={textPrimary}
                        aria-label="Kamaytirish"
                      />
                      <NumberInput
                        size="sm"
                        maxW="70px"
                        min={1}
                        value={item.count}
                        onChange={(_, val) => updateCount(item.productId, val)}
                      >
                        <NumberInputField
                          textAlign="center"
                          px={1}
                          bg={inputBg}
                          color={textPrimary}
                          borderColor={borderColor}
                        />
                      </NumberInput>
                      <IconButton
                        size="xs"
                        icon={<AddIcon />}
                        onClick={() =>
                          updateCount(item.productId, item.count + 1)
                        }
                        variant="outline"
                        borderColor={borderColor}
                        color={textPrimary}
                        aria-label="Oshirish"
                      />
                    </HStack>
                  </Td>
                  <Td isNumeric fontWeight="semibold" color={accentColor}>
                    {formatPrice(item.price * item.count)}
                  </Td>
                  <Td>
                    <IconButton
                      size="sm"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => removeItem(item.productId)}
                      aria-label="O'chirish"
                    />
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* JAMI VA TASDIQLASH */}
      {orderItems.length > 0 && (
        <VStack align="stretch" spacing={3}>
          <Flex
            justify="space-between"
            align="flex-start"
            bg={bgCard}
            p={5}
            borderRadius="xl"
            border="1px solid"
            borderColor={borderColor}
            flexWrap="wrap"
            gap={3}
          >
            <VStack align="flex-start" spacing={0}>
              <Text color={textMuted} fontSize="sm">
                Umumiy summa
              </Text>
              <Heading size="md" color={accentColor}>
                {formatPrice(totalSum)}
              </Heading>
            </VStack>

            {/* O'ng tomon: badge'lar + inputlar */}
            <HStack
              spacing={3}
              flexWrap="wrap"
              align="flex-end"
              justify="flex-end"
            >
              <Badge
                colorScheme={orderType === "sale" ? "blue" : "orange"}
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="md"
              >
                {orderType === "sale" ? "Sotuv" : "Utilizatsiya"}
              </Badge>
              <Badge
                colorScheme="gray"
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="md"
              >
                {orderItems.length} ta mahsulot
              </Badge>

              <VStack align="flex-start" spacing={1}>
                <Text fontSize="sm" color={textMuted}>
                  Stol raqamini kiriting
                </Text>
                <Input
                  size="md"
                  maxW="160px"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Stol raqami"
                  bg={inputBg}
                  color={textPrimary}
                  borderColor={borderColor}
                />
              </VStack>

              <VStack align="flex-start" spacing={1}>
                <Text fontSize="sm" color={textMuted}>
                  Izoh
                </Text>
                <Textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Izoh (ixtiyoriy)"
                  bg={inputBg}
                  color={textPrimary}
                  borderColor={borderColor}
                  minW={{ base: "full", md: "220px" }}
                  maxW="320px"
                  rows={1}
                  resize="vertical"
                />
              </VStack>
            </HStack>
          </Flex>

          {/* Tugma card'dan tashqarida, o'ng tomonda */}
          <Flex justify="flex-end">
            <Button
              colorScheme="blue"
              size="lg"
              onClick={createOrder}
              isLoading={loading}
              loadingText="Yaratilmoqda..."
            >
              Buyurtmani tasdiqlash
            </Button>
          </Flex>
        </VStack>
      )}

      <ProductModal
        isOpen={sidebar.isOpen}
        onClose={sidebar.onClose}
        orderItems={orderItems}
        addItem={addItem}
      />

      {/* FIX: bu yerda avval paymentId, onSumUpdated va cafeWarehouseId
          umuman uzatilmagan edi. Shu sabab "Yangi buyurtma" sahifasida
          Receiptmodal'ning to'lov (payment) ko'rinishi cafeWarehouseId'ni
          hech qachon olmas, kassa/to'lov usuli ro'yxatlari doim bo'sh
          chiqardi va "Tasdiqlash" bossangiz ham onSumUpdated yo'qligi
          sabab hech narsa yubormas edi. */}
      <Receiptmodal
        isOpen={receipt.isOpen}
        onClose={receipt.onClose}
        paymentData={paymentData}
        orderItems={savedOrderItems}
        onPaymentClick={editSumModal.onOpen} // Передаем функцию открытия Editsummodal
        paymentId={currentPaymentId}
        onSumUpdated={handleEditSum}
        cafeWarehouseId={cafeWarehouseId}
      />

      {/* SUMMANI TAHRIRLASH MODAL */}
      <Editsummodal
        cafeWarehouseId={cafeWarehouseId}
        isOpen={editSumModal.isOpen}
        onClose={editSumModal.onClose}
        paymentId={currentPaymentId}
        onSumUpdated={handleEditSum}
        orderData={orderData?.payment}
      />
    </Box>
  );
}
