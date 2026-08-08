import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormLabel,
  VStack,
  Text,
  useColorModeValue,
  useToast,
  HStack,
  Box,
  Grid,
  Flex,
  Select,
  IconButton,
  Input,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { apiPayMethods } from "../../../../utils/Controllers/apiPayMethods";
import { apiCashs } from "../../../../utils/Controllers/apiCashs";
import { Plus, X } from "lucide-react";

export default function OrderPayment({
  isOpen,
  onClose,
  paymentId,
  orderData,
  onSumUpdated,
  cafeWarehouseId,
}) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const bgModal = useColorModeValue("white", "gray.800");
  const textPrimary = useColorModeValue("gray.800", "gray.100");
  const textMuted = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const accentColor = useColorModeValue("blue.600", "blue.300");
  const buttonBg = useColorModeValue("gray.100", "gray.700");
  const buttonHoverBg = useColorModeValue("gray.200", "gray.600");
  const buttonActiveBg = useColorModeValue("gray.300", "gray.500");
  const inputBg = useColorModeValue("white", "gray.700");
  const summaryBg = useColorModeValue("gray.50", "gray.700");

  const [cashs, setCashs] = useState([]);
  const [payMethods, setPayMethods] = useState([]);
  const [selectedCash, setSelectedCash] = useState("");

  // ─── To'lov qatorlari ───
  // Birinchi qator ("main") - asosiy to'lov usuli, o'chirib bo'lmaydi.
  // Qolganlari plus bosilganda qo'shiladi, X bilan o'chiriladi.
  const [payments, setPayments] = useState([
    { id: "main", payMethodId: "", sum: "" },
  ]);
  const [activeRowId, setActiveRowId] = useState("main");

  // ─── API calls ───
  const GetCash = async () => {
    try {
      const response = await apiCashs.getAll();
      const allCashs = response.data || response;
      const filteredCashs = allCashs.filter(
        (cash) => cash.locationId === cafeWarehouseId,
      );
      setCashs(filteredCashs);
      setSelectedCash(filteredCashs[0]?.id || "");
    } catch (error) {}
  };

  const GetPaymentMethod = async () => {
    try {
      const response = await apiPayMethods.getAll();
      const allPayMethods =
        response.data?.payMethods || response.payMethods || [];

      const filteredPayMethods = allPayMethods.filter(
        (method) => method.locationId === cafeWarehouseId,
      );
      setPayMethods(filteredPayMethods);

      const findNaqt = filteredPayMethods?.find((e) =>
        e?.name?.toLowerCase().includes("naq"),
      );
      const defaultMethodId = findNaqt
        ? findNaqt.id
        : filteredPayMethods?.[1]?.id || "";

      setPayments((prev) => {
        const updated = [...prev];
        updated[0] = { ...updated[0], payMethodId: defaultMethodId };
        return updated;
      });
    } finally {
    }
  };

  useEffect(() => {
    if (cafeWarehouseId) {
      GetCash();
      GetPaymentMethod();
    }
  }, [cafeWarehouseId]);

  // Asosiy qatorga buyurtma summasini avtomatik joylash
  useEffect(() => {
    if (orderData?.totalSum) {
      setPayments((prev) => {
        const updated = [...prev];
        updated[0] = { ...updated[0], sum: orderData.totalSum.toString() };
        return updated;
      });
    }
  }, [orderData]);

  const formatPrice = (price) =>
    Number(price || 0).toLocaleString("uz-UZ") + " so'm";

  // ─── Aktiv qatorning summasini yangilash helperi ───
  const updateActiveRowSum = (updater) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === activeRowId ? { ...p, sum: updater(p.sum) } : p,
      ),
    );
  };

  const handleNumberClick = (number) => {
    updateActiveRowSum((prevSum) =>
      prevSum === "0" || prevSum === ""
        ? number.toString()
        : prevSum + number.toString(),
    );
  };

  const handleDotClick = () => {
    updateActiveRowSum((prevSum) =>
      prevSum.includes(".") ? prevSum : prevSum + ".",
    );
  };

  const handleDeleteClick = () => {
    updateActiveRowSum((prevSum) => prevSum.slice(0, -1));
  };

  const handleClearClick = () => {
    updateActiveRowSum(() => "");
  };

  // ─── FIX: "To'liq summa" endi qolgan (kiritilmagan) summani aktiv qatorga qo'yadi ───
  const handleFullAmountClick = () => {
    if (!orderData?.totalSum) return;

    const otherRowsSum = payments
      .filter((item) => item.id !== activeRowId)
      .reduce((acc, item) => acc + (parseFloat(item.sum) || 0), 0);

    const remaining = Number(orderData.totalSum) - otherRowsSum;

    updateActiveRowSum(() => (remaining > 0 ? remaining.toString() : "0"));
  };

  // ─── Qator qo'shish / o'chirish ───
  const handleAddPaymentRow = () => {
    const newId = Date.now() + Math.random();
    setPayments((prev) => [...prev, { id: newId, payMethodId: "", sum: "" }]);
    setActiveRowId(newId);
  };

  const handleRemovePaymentRow = (id) => {
    setPayments((prev) => prev.filter((item) => item.id !== id));
    if (activeRowId === id) setActiveRowId("main");
  };

  const handleRowPayMethodChange = (id, value) => {
    setPayments((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, payMethodId: value } : item,
      ),
    );
  };

  const handleRowSumChange = (id, value) => {
    setPayments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, sum: value } : item)),
    );
  };

  const receivedSum = payments.reduce(
    (acc, item) => acc + (parseFloat(item.sum) || 0),
    0,
  );

  const activePaymentMethodName = payMethods.find(
    (m) => m.id === payments.find((p) => p.id === activeRowId)?.payMethodId,
  )?.name;

  const handleSubmit = async () => {
    const validPayments = payments.filter(
      (item) => item.payMethodId && parseFloat(item.sum) > 0,
    );

    if (validPayments.length === 0) {
      toast({
        title: "Kamida bitta to'lov usuli va summasini kiriting",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    if (!selectedCash) {
      toast({
        title: "Kassani tanlang",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const methods = validPayments.map((item) => ({
      payMethodId: item.payMethodId,
      amount: parseFloat(item.sum),
    }));

    const totalReceived = methods.reduce((acc, m) => acc + m.amount, 0);

    setLoading(true);
    try {
      const data = {
        cashId: selectedCash,
        receivedSum: totalReceived,
        methods,
      };
      await onSumUpdated(paymentId, data);

      setPayments([{ id: "main", payMethodId: "", sum: "" }]);
      setActiveRowId("main");
      onClose();
    } catch (error) {
      toast({
        title: "Xatolik yuz berdi",
        description:
          error?.response?.data?.message || "Summani yangilashda xatolik",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPayments([{ id: "main", payMethodId: "", sum: "" }]);
    setActiveRowId("main");
    onClose();
  };

  const totalSum = orderData?.totalSum || 0;
  const changeSum = receivedSum - totalSum;

  const keyboardButtons = [
    { label: "1", onClick: () => handleNumberClick(1) },
    { label: "2", onClick: () => handleNumberClick(2) },
    { label: "3", onClick: () => handleNumberClick(3) },
    { label: "4", onClick: () => handleNumberClick(4) },
    { label: "5", onClick: () => handleNumberClick(5) },
    { label: "6", onClick: () => handleNumberClick(6) },
    { label: "7", onClick: () => handleNumberClick(7) },
    { label: "8", onClick: () => handleNumberClick(8) },
    { label: "9", onClick: () => handleNumberClick(9) },
    { label: ".", onClick: handleDotClick },
    { label: "0", onClick: () => handleNumberClick(0) },
    { label: "⌫", onClick: handleDeleteClick },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm" isCentered>
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent bg={bgModal} maxW="420px">
        <ModalHeader pb={2} pt={4}>
          <Text fontSize="lg" color={textPrimary}>
            To'lov qilish
          </Text>
          {orderData?.payNumber && (
            <Text fontSize="xs" fontWeight="normal" color={textMuted} mt={0.5}>
              Buyurtma: {orderData.payNumber}
            </Text>
          )}
        </ModalHeader>
        <ModalCloseButton size="sm" />

        <ModalBody py={2} px={4}>
          <VStack spacing={3} align="stretch">
            <Box>
              <Select
                placeholder="Kassani tanlang"
                w="100%"
                mb={2}
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

              {/* To'lov usuli qatorlari */}
              {payments.map((item, index) => (
                <HStack key={item.id} mt={index === 0 ? 0 : 2}>
                  <Select
                    placeholder="To'lov usuli"
                    bg={inputBg}
                    borderColor={
                      activeRowId === item.id ? accentColor : borderColor
                    }
                    color={textPrimary}
                    value={item.payMethodId}
                    onFocus={() => setActiveRowId(item.id)}
                    onChange={(e) =>
                      handleRowPayMethodChange(item.id, e.target.value)
                    }
                  >
                    {payMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </Select>

                  {item.payMethodId && (
                    <Input
                      type="number"
                      placeholder="Summa"
                      maxW="130px"
                      bg={inputBg}
                      borderColor={
                        activeRowId === item.id ? accentColor : borderColor
                      }
                      color={textPrimary}
                      value={item.sum}
                      onFocus={() => setActiveRowId(item.id)}
                      onChange={(e) =>
                        handleRowSumChange(item.id, e.target.value)
                      }
                    />
                  )}

                  {index === 0 ? (
                    <IconButton
                      icon={<Plus size={14} />}
                      aria-label="To'lov usuli qo'shish"
                      borderRadius="full"
                      colorScheme="blue"
                      variant="outline"
                      onClick={handleAddPaymentRow}
                      size="sm"
                      minW="32px"
                      h="32px"
                    />
                  ) : (
                    <IconButton
                      icon={<X size={16} />}
                      aria-label="O'chirish"
                      borderRadius="full"
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleRemovePaymentRow(item.id)}
                    />
                  )}
                </HStack>
              ))}

              {payments.length > 1 && (
                <Text fontSize="xs" color={textMuted} mt={1} textAlign="right">
                  Jami kiritilgan: {formatPrice(receivedSum)}
                </Text>
              )}
            </Box>

            {/* Buyurtma ma'lumotlari */}
            <Box
              p={2}
              bg={summaryBg}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <HStack justify="space-between" spacing={2}>
                <VStack align="flex-start" spacing={0} flex={1}>
                  <Text fontSize="xs" color={textMuted}>
                    Jami summa:
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color={accentColor}>
                    {formatPrice(totalSum)}
                  </Text>
                </VStack>

                {orderData?.payMethod?.name && (
                  <VStack align="flex-end" spacing={0} flex={1}>
                    <Text fontSize="xs" color={textMuted}>
                      To'lov usuli:
                    </Text>
                    <Text fontSize="sm" color={textPrimary}>
                      {orderData.payMethod.name}
                    </Text>
                  </VStack>
                )}
              </HStack>
            </Box>

            {/* Qabul qilingan summa (umumiy) */}
            <Box>
              <FormLabel fontSize="sm" mb={1} color={textPrimary}>
                Qabul qilingan summa
              </FormLabel>
              <Box
                p={3}
                bg={summaryBg}
                borderRadius="md"
                borderWidth="1px"
                borderColor={borderColor}
                minH="60px"
                display="flex"
                alignItems="center"
                justifyContent="flex-end"
              >
                <Text
                  fontSize="xl"
                  fontWeight="bold"
                  color={receivedSum ? accentColor : textMuted}
                  fontFamily="monospace"
                  textAlign="right"
                  noOfLines={1}
                >
                  {receivedSum ? formatPrice(receivedSum) : "0 so'm"}
                </Text>
              </Box>

              <Flex gap={1} mt={2} justifyContent="space-between">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleFullAmountClick}
                  isDisabled={!orderData?.totalSum}
                  flex={1}
                  mr={1}
                >
                  To'liq summa
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="red"
                  onClick={handleClearClick}
                  flex={1}
                  ml={1}
                >
                  Tozalash
                </Button>
              </Flex>
            </Box>

            {/* Virtual klaviatura */}
            <Box>
              <Text fontSize="xs" color={textMuted} mb={1}>
                Klaviatura
                {activePaymentMethodName ? ` — ${activePaymentMethodName}` : ""}
                :
              </Text>
              <Grid
                templateColumns="repeat(3, 1fr)"
                gap={1.5}
                autoRows="minmax(40px, auto)"
              >
                {keyboardButtons.map((btn, index) => (
                  <Button
                    key={index}
                    height="40px"
                    fontSize={btn.label === "⌫" ? "md" : "lg"}
                    fontWeight="bold"
                    bg={buttonBg}
                    _hover={{ bg: buttonHoverBg }}
                    _active={{ bg: buttonActiveBg }}
                    onClick={btn.onClick}
                    isDisabled={loading}
                    p={1}
                  >
                    {btn.label}
                  </Button>
                ))}
              </Grid>
            </Box>

            {/* Qaytim */}
            {receivedSum > 0 && (
              <Box
                p={2}
                mt={1}
                bg={
                  changeSum >= 0
                    ? useColorModeValue("green.50", "green.900")
                    : useColorModeValue("red.50", "red.900")
                }
                borderRadius="md"
                borderWidth="1px"
                borderColor={changeSum >= 0 ? "green.200" : "red.200"}
              >
                <HStack justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight="medium" color={textPrimary}>
                    Qaytim:
                  </Text>
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    color={changeSum >= 0 ? "green.600" : "red.600"}
                  >
                    {formatPrice(Math.abs(changeSum))}
                  </Text>
                </HStack>
                {changeSum < 0 && (
                  <Text fontSize="xs" color="red.600" mt={0.5}>
                    ⚠️ Summa yetarli emas!
                  </Text>
                )}
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter
          borderTopWidth="1px"
          borderColor={borderColor}
          pt={3}
          pb={3}
        >
          <Flex width="100%" justify="space-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              isDisabled={loading}
              flex={1}
              mr={1}
            >
              Bekor qilish
            </Button>
            <Button
              colorScheme="green"
              onClick={handleSubmit}
              isLoading={loading}
              loadingText="To'lanmoqda..."
              isDisabled={
                !payments.some(
                  (item) => item.payMethodId && parseFloat(item.sum) > 0,
                )
              }
              size="sm"
              flex={1}
              ml={1}
            >
              Tasdiqlash
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
