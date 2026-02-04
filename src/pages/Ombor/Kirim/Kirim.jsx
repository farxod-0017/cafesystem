import React, { useState, useMemo } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Input,
  Select,
  Stack,
  HStack,
  VStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Divider,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";

// ==============================
// STATIK MA'LUMOTLAR (API KEYIN ULANADI)
// ==============================
// TODO: API -> GET /products
const PRODUCTS = Array.from({ length: 25 }).map((_, i) => ({
  id: i + 1,
  nomi: `Mahsulot ${i + 1}`,
  barcode: `0000${i + 1}`,
  narx: 12500,
  birlik: "kg",
}));

export default function OmborKirim() {
  const sidebar = useDisclosure();
  const modal = useDisclosure();

  const [search, setSearch] = useState("");
  const [tanlangan, setTanlangan] = useState([]);

  // TODO: debounce + API search
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) =>
      p.nomi.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const addProduct = (p) => {
    if (tanlangan.find((t) => t.id === p.id)) return;
    setTanlangan([
      ...tanlangan,
      { ...p, miqdor: 1, summa: p.narx },
    ]);
  };

  const updateQty = (id, qty) => {
    setTanlangan((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, miqdor: qty, summa: qty * p.narx }
          : p
      )
    );
  };

  const updatePrice = (id, price) => {
    setTanlangan((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, narx: price, summa: price * p.miqdor }
          : p
      )
    );
  };

  const updateSellPrice = (id, sellPrice) => {
    setTanlangan((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, sotuvNarx: sellPrice } : p
      )
    );
  };

  const removeItem = (id) => {
    setTanlangan((prev) => prev.filter((p) => p.id !== id));
  };

  const jami = tanlangan.reduce((s, p) => s + p.summa, 0);

  return (
    <Box bg="bg" minH="100vh" p={{ base: 4, md: 6 }}>
      {/* HEADER */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Omborga kirim</Heading>
        <Button variant="solidPrimary" onClick={sidebar.onOpen}>
          Mahsulotlar
        </Button>
      </Flex>

      {/* META MA'LUMOTLAR */}
      <Stack direction={{ base: "column", md: "row" }} spacing={4} mb={6}>
        <Select placeholder="Jo'natuvchi" maxW="300px">
          {/* TODO: API -> GET /partners */}
          <option>BJ Partnyor</option>
        </Select>
        <Input value="Asosiy ombor" isReadOnly maxW="300px" />
        <Input
          type="datetime-local"
          defaultValue="2026-02-04T10:28"
          maxW="260px"
        />
      </Stack>

      {/* QIDIRUV */}
      <Input
        placeholder="Mahsulot qidirish..."
        mb={4}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* SEARCH RESULT */}
      <Box
        bg="surface"
        borderRadius="xl"
        border="1px solid"
        borderColor="border"
        mb={6}
      >
        {filteredProducts.slice(0, 5).map((p) => (
          <Flex
            key={p.id}
            p={3}
            justify="space-between"
            _hover={{ bg: "neutral.100", _dark: { bg: "neutral.700" } }}
            cursor="pointer"
            onClick={() => addProduct(p)}
          >
            <Text>{p.nomi}</Text>
            <Text>{p.narx.toLocaleString()} so'm</Text>
          </Flex>
        ))}
      </Box>

      {/* TANLANGANLAR TABLE */}
      <Box overflowX="auto" bg="surface" borderRadius="xl" p={4}>
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Partiya</Th>
              <Th>Nomlanishi</Th>
              <Th>Narx</Th>
              <Th>Sotuv narxi</Th>
              <Th>Miqdor</Th>
              <Th>Birlik</Th>
              <Th>Jami</Th>
              <Th>O'chirish</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tanlangan.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <Checkbox />
                </Td>
                <Td>{p.nomi}</Td>
                <Td>
                  <Input
                    type="number"
                    value={p.narx}
                    onChange={(e) => updatePrice(p.id, +e.target.value)}
                    maxW="110px"
                  />
                </Td>
                <Td>
                  <Input
                    type="number"
                    value={p.sotuvNarx || ""}
                    placeholder="Sotuv"
                    onChange={(e) => updateSellPrice(p.id, +e.target.value)}
                    maxW="110px"
                  />
                </Td>
                <Td>
                  <Input
                    type="number"
                    value={p.miqdor}
                    onChange={(e) => updateQty(p.id, +e.target.value)}
                    maxW="80px"
                  />
                </Td>
                <Td>{p.birlik}</Td>
                <Td>{p.summa.toLocaleString()}</Td>
                <Td>
                  <IconButton
                    icon={<DeleteIcon />}
                    size="sm"
                    onClick={() => removeItem(p.id)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* FOOTER */}
      <Flex justify="flex-end" mt={6}>
        <Button variant="solidPrimary" onClick={modal.onOpen}>
          Yakunlash
        </Button>
      </Flex>

      {/* SIDEBAR */}
      <Drawer isOpen={sidebar.isOpen} placement="left" onClose={sidebar.onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Mahsulotlar</DrawerHeader>
          <DrawerBody>
            {PRODUCTS.map((p) => (
              <Box
                key={p.id}
                p={2}
                borderBottom="1px solid"
                borderColor="border"
                cursor="pointer"
                onClick={() => addProduct(p)}
              >
                {p.nomi}
              </Box>
            ))}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* MODAL */}
      <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Hujjatni tasdiqlash</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <Text>Hujjat: Omborga kirim</Text>
              <Text>Jo'natuvchi: BJ Partnyor</Text>
              <Text>Qabul qiluvchi: Asosiy ombor</Text>
              <Text>Umumiy summa: {jami.toLocaleString()} so'm</Text>
              <Divider />
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>#</Th>
                    <Th>Nomlanishi</Th>
                    <Th>Narx</Th>
                    <Th>Miqdor</Th>
                    <Th>Jami</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {tanlangan.map((p, i) => (
                    <Tr key={p.id}>
                      <Td>{i + 1}</Td>
                      <Td>{p.nomi}</Td>
                      <Td>{p.narx}</Td>
                      <Td>{p.miqdor}</Td>
                      <Td>{p.summa}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outlinePrimary" onClick={modal.onClose}>
                Bekor qilish
              </Button>
              {/* TODO: API -> POST /warehouse-income */}
              <Button variant="solidPrimary">Saqlash</Button>
              <Button
                variant="outlinePrimary"
                onClick={() => window.print()}
              >
                Chop etish
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
