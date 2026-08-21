import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Box,
  Text,
  Divider,
  VStack,
  HStack,
  Grid,
  Flex,
  Select,
  IconButton,
  Input,
  FormLabel,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { Plus, X } from "lucide-react";
import { apiPayMethods } from "../../../../utils/Controllers/apiPayMethods";
import { apiCashs } from "../../../../utils/Controllers/apiCashs";

export default function ReceiptModal({
  isOpen,
  onClose,
  paymentData,
  orderItems,
  onPaymentClick, // ixtiyoriy: agar tashqi modal ochish kerak bo'lsa hali ham ishlatilishi mumkin
  paymentId,
  onSumUpdated,
  cafeWarehouseId,
}) {
  const toast = useToast();

  // ─── Rang sxemalari ───
  const bgReceipt = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.300", "gray.600");
  const textPrimary = useColorModeValue("gray.800", "gray.100");
  const textMuted = useColorModeValue("gray.600", "gray.400");
  const accentColor = useColorModeValue("blue.600", "blue.300");
  const buttonBg = useColorModeValue("gray.100", "gray.700");
  const buttonHoverBg = useColorModeValue("gray.200", "gray.600");
  const buttonActiveBg = useColorModeValue("gray.300", "gray.500");
  const inputBg = useColorModeValue("white", "gray.700");
  const summaryBg = useColorModeValue("gray.50", "gray.700");
  const changeBgPositive = useColorModeValue("green.50", "green.900");
  const changeBgNegative = useColorModeValue("red.50", "red.900");

  // ─── Ko'rinish: "receipt" (chek) yoki "payment" (to'lov formasi) ───
  const [view, setView] = useState("receipt");

  // ─── To'lov uchun state'lar (OrderPayment.jsx dan) ───
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [cashs, setCashs] = useState([]);
  const [payMethods, setPayMethods] = useState([]);
  const [selectedCash, setSelectedCash] = useState("");
  const [payments, setPayments] = useState([
    { id: "main", payMethodId: "", sum: "" },
  ]);
  const [activeRowId, setActiveRowId] = useState("main");

  // ─── Narxni formatlash ───
  const formatPrice = (price) =>
    Number(price || 0).toLocaleString("uz-UZ") + " so'm";

  // ─── Sanani formatlash ───
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─── API: kassalar va to'lov usullarini birga yuklash ───
  // Ikkalasini bitta funksiyada, Promise.all bilan yuklaymiz — shunda
  // loading holatini aniq boshqarish va xatoликларни foydalanuvchiga
  // ko'rsatish mumkin (avval xatolar jimgina yutilib, dropdown'lar
  // bo'sh qolib ketardi).
  const loadPaymentOptions = async () => {
    setLoadingOptions(true);
    try {
      const [cashRes, payMethodRes] = await Promise.all([
        apiCashs.getAll(),
        apiPayMethods.getAll(),
      ]);

      const allCashs = cashRes?.data || cashRes || [];
      const filteredCashs = allCashs.filter(
        (cash) => cash.locationId === cafeWarehouseId,
      );
      setCashs(filteredCashs);
      // Kassa avtomatik tanlanmaydi — foydalanuvchi o'zi tanlashi kerak.

      const allPayMethods =
        payMethodRes?.data?.payMethods || payMethodRes?.payMethods || [];
      const filteredPayMethods = allPayMethods.filter(
        (method) => method.locationId === cafeWarehouseId,
      );
      setPayMethods(filteredPayMethods);

      // ─── Asosiy qatorga to'lov usulini avtomatik tanlash ───
      // Avval nomi "naq" so'zini o'z ichiga olgan usul qidiriladi,
      // topilmasa ro'yxatdagi 2-element (index 1) olinadi.
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

      // Ma'lumot kelmasa (masalan shu joy uchun kassa/usul sozlanmagan),
      // buni sukut saqlab yashirmasdan, kassirga ochiq aytamiz.
      if (filteredCashs.length === 0 || filteredPayMethods.length === 0) {
        toast({
          title: "To'lov qilish uchun sozlamalar to'liq emas",
          description:
            filteredCashs.length === 0 && filteredPayMethods.length === 0
              ? "Ushbu joy uchun kassa va to'lov usuli topilmadi. Administratordan so'rang."
              : filteredCashs.length === 0
                ? "Ushbu joy uchun kassa topilmadi. Administratordan so'rang."
                : "Ushbu joy uchun to'lov usuli topilmadi. Administratordan so'rang.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      // Avval bu yerda xato butunlay yutilar edi — kassir hech narsa
      // ko'rmay, bo'sh dropdown bilan qolardi. Endi aniq xabar beramiz.
      toast({
        title: "Kassa/to'lov usullarini yuklab bo'lmadi",
        description:
          error?.response?.data?.message ||
          "Internet aloqasini tekshiring yoki qayta urinib ko'ring.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      setCashs([]);
      setPayMethods([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  // ─── To'lov formasini boshlang'ich holatga qaytarish ───
  const resetPaymentForm = () => {
    setPayments([{ id: "main", payMethodId: "", sum: "" }]);
    setActiveRowId("main");
    setSelectedCash("");
  };

  // ─── "To'lov qilish" bosilganda ko'rinishni almashtirish ───
  const handlePayment = () => {
    resetPaymentForm();
    setView("payment");
  };

  // ─── Payment view ochilganda kassa/usullarni yuklash ───
  useEffect(() => {
    if (isOpen && view === "payment" && cafeWarehouseId) {
      loadPaymentOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, view, cafeWarehouseId]);

  // ─── Modal yopilganda holatni tozalash ───
  useEffect(() => {
    if (!isOpen) {
      setView("receipt");
      resetPaymentForm();
    }
  }, [isOpen]);

  // ─── Payment view ochilganda asosiy qatorga summani avtomatik joylash ───
  useEffect(() => {
    if (isOpen && view === "payment" && paymentData?.totalSum) {
      setPayments((prev) => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          sum: paymentData.totalSum.toString(),
        };
        return updated;
      });
    }
  }, [isOpen, view, paymentData]);

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

  // ─── "To'liq summa" — qolgan (kiritilmagan) summani aktiv qatorga qo'yadi ───
  const handleFullAmountClick = () => {
    if (!paymentData?.totalSum) return;

    const otherRowsSum = payments
      .filter((item) => item.id !== activeRowId)
      .reduce((acc, item) => acc + (parseFloat(item.sum) || 0), 0);

    const remaining = Number(paymentData.totalSum) - otherRowsSum;

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

  const totalSum = paymentData?.totalSum || 0;
  const changeSum = receivedSum - totalSum;

  // ─── To'lovni yuborish ───
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

      resetPaymentForm();
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

  // ─── Orqaga (chekka) qaytish ───
  const handleBackToReceipt = () => {
    resetPaymentForm();
    setView("receipt");
  };

  // ─── Modalni yopish ───
  const handleClose = () => {
    resetPaymentForm();
    setView("receipt");
    onClose();
  };

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

  if (!paymentData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={view === "payment" ? "sm" : "md"}
      isCentered
      scrollBehavior="inside"
    >
      <ModalOverlay
        backdropFilter={view === "payment" ? "blur(2px)" : undefined}
      />
      <ModalContent
        bg={bgReceipt}
        maxH="90vh"
        maxW={view === "payment" ? "420px" : undefined}
      >
        {view === "receipt" ? (
          <>
            <ModalHeader
              textAlign="center"
              borderBottomWidth="1px"
              borderColor={borderColor}
              position="sticky"
              top={0}
              bg={bgReceipt}
              zIndex={1}
            >
              <Text fontSize="2xl" fontWeight="bold" color={textPrimary}>
                CHEK
              </Text>
            </ModalHeader>

            <ModalBody
              py={6}
              id="receipt-content"
              overflowY="auto"
              maxH="calc(90vh - 140px)"
            >
              <VStack spacing={4} align="stretch">
                {/* Chek raqami va sana */}
                <Box textAlign="center">
                  <Text fontSize="lg" fontWeight="bold" color={textPrimary}>
                    {paymentData.payNumber}
                  </Text>
                  <Text fontSize="sm" color={textMuted}>
                    {formatDate(paymentData.createdAt)}
                  </Text>
                </Box>

                <Divider borderColor={borderColor} />

                {/* Mahsulotlar ro'yxati */}
                <Box>
                  <Text fontWeight="bold" mb={3} color={textPrimary}>
                    Mahsulotlar:
                  </Text>
                  <VStack spacing={2} align="stretch">
                    {orderItems.map((item, index) => (
                      <HStack key={index} justify="space-between" fontSize="sm">
                        <HStack flex={1}>
                          <Text color={textMuted}>{index + 1}.</Text>
                          <Text color={textPrimary}>{item.name}</Text>
                          <Text color={textMuted}>x{item.count}</Text>
                        </HStack>
                        <Text fontWeight="semibold" color={textPrimary}>
                          {formatPrice(item.price * item.count)}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                <Divider borderColor={borderColor} />

                {/* Jami summa */}
                <HStack justify="space-between" py={2}>
                  <Text fontSize="lg" fontWeight="bold" color={textPrimary}>
                    JAMI:
                  </Text>
                  <Text fontSize="xl" fontWeight="bold" color="blue.500">
                    {formatPrice(paymentData.totalSum)}
                  </Text>
                </HStack>

                {/* Qabul qilingan va qaytim */}
                {paymentData.type === "cash" && (
                  <>
                    <HStack justify="space-between">
                      <Text color={textMuted}>Qabul qilindi:</Text>
                      <Text fontWeight="semibold" color={textPrimary}>
                        {formatPrice(paymentData.receivedSum)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color={textMuted}>Qaytim:</Text>
                      <Text fontWeight="semibold" color={textPrimary}>
                        {formatPrice(paymentData.changeSum)}
                      </Text>
                    </HStack>
                  </>
                )}

                <Divider borderColor={borderColor} />

                {/* Footer */}
                <Box textAlign="center" pt={2}>
                  <Text fontSize="xs" color={textMuted}>
                    Xaridingiz uchun rahmat!
                  </Text>
                  <Text fontSize="xs" color={textMuted}>
                    ID: {paymentData.id}
                  </Text>
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter
              borderTopWidth="1px"
              borderColor={borderColor}
              position="sticky"
              bottom={0}
              bg={bgReceipt}
              zIndex={1}
            >
              <Button variant="ghost" mr={3} onClick={handleClose}>
                {paymentData?.type === "disposal"
                  ? "Yopish"
                  : "Keyinroq to'lov qilish"}
              </Button>
              {paymentData.type !== "disposal" && (
                <Button colorScheme="green" onClick={handlePayment}>
                  To'lov qilish
                </Button>
              )}
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalHeader pb={2} pt={4}>
              <Text fontSize="lg" color={textPrimary}>
                To'lov qilish
              </Text>
              {paymentData?.payNumber && (
                <Text
                  fontSize="xs"
                  fontWeight="normal"
                  color={textMuted}
                  mt={0.5}
                >
                  Buyurtma: {paymentData.payNumber}
                </Text>
              )}
            </ModalHeader>
            <ModalCloseButton size="sm" onClick={handleClose} />

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
                    isDisabled={loadingOptions}
                  >
                    {cashs.map((cash) => (
                      <option key={cash.id} value={cash.id}>
                        {cash.name}
                      </option>
                    ))}
                  </Select>
                  {!loadingOptions && cashs.length === 0 && (
                    <Text fontSize="xs" color="red.500" mt={-1} mb={2}>
                      Bu joy uchun kassa topilmadi. Administratordan so'rang
                      yoki qayta urinib ko'ring.
                    </Text>
                  )}

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
                        isDisabled={loadingOptions}
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

                  {!loadingOptions && payMethods.length === 0 && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      Bu joy uchun to'lov usuli topilmadi. Administratordan
                      so'rang yoki qayta urinib ko'ring.
                    </Text>
                  )}

                  {payments.length > 1 && (
                    <Text
                      fontSize="xs"
                      color={textMuted}
                      mt={1}
                      textAlign="right"
                    >
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

                    {paymentData?.payMethod?.name && (
                      <VStack align="flex-end" spacing={0} flex={1}>
                        <Text fontSize="xs" color={textMuted}>
                          To'lov usuli:
                        </Text>
                        <Text fontSize="sm" color={textPrimary}>
                          {paymentData.payMethod.name}
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
                      isDisabled={!paymentData?.totalSum}
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
                    {activePaymentMethodName
                      ? ` — ${activePaymentMethodName}`
                      : ""}
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
                    bg={changeSum >= 0 ? changeBgPositive : changeBgNegative}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={changeSum >= 0 ? "green.200" : "red.200"}
                  >
                    <HStack justify="space-between" align="center">
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color={textPrimary}
                      >
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
                  onClick={handleBackToReceipt}
                  isDisabled={loading}
                  flex={1}
                  mr={1}
                >
                  Orqaga
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleSubmit}
                  isLoading={loading}
                  loadingText="To'lanmoqda..."
                  isDisabled={
                    loadingOptions ||
                    cashs.length === 0 ||
                    payMethods.length === 0 ||
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
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
