// components/guards/WarehouseGuard.jsx
import { useEffect, useState } from "react";
import { Box, Text, VStack, useColorModeValue } from "@chakra-ui/react";
import { useWarehouseStore } from "../store/useWarehouseStore";
import { apiLocations } from "../utils/Controllers/apiLocations";
import TopLoadingLine from "../components/common/TopLoadingLine";

export default function WarehouseGuard({ isCafe, children }) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const {
        mainWarehouseId,
        cafeWarehouseId,
        setMainWarehouseId,
        setCafeWarehouseId,
    } = useWarehouseStore();


    useEffect(() => {
        const checkAndSetWarehouse = async () => {
            // Store'da mavjudmi tekshirish
            const currentWarehouseId = isCafe ? cafeWarehouseId : mainWarehouseId;

            if (currentWarehouseId) {
                setIsLoading(false);                
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // API'dan warehouse'larni olish
                const warehouses = await apiLocations.getWarehouses();

                if (!warehouses || !warehouses.data || warehouses.data.length === 0) {
                    throw new Error("Ombor topilmadi");
                }

                // isCafe qiymatiga qarab kerakli warehouse'ni topish
                const targetWarehouse = warehouses.data.find(
                    (w) => w.isCafe === isCafe
                );

                if (!targetWarehouse) {
                    throw new Error(
                        isCafe
                            ? "Kafe ombori topilmadi"
                            : "Asosiy ombor topilmadi"
                    );
                }

                // Store'ga saqlash
                if (isCafe) {
                    setCafeWarehouseId(targetWarehouse.id);
                } else {
                    setMainWarehouseId(targetWarehouse.id);
                }

                setIsLoading(false);
            } catch (err) {
                console.error("Warehouse yuklashda xatolik:", err);
                setError(err.message || "Ombor ma'lumotlari yuklanmadi");
                setIsLoading(false);
            }
        };

        checkAndSetWarehouse();
    }, [isCafe, mainWarehouseId, cafeWarehouseId, setMainWarehouseId, setCafeWarehouseId]);

    // Retry funksiyasi
    const handleRetry = () => {
        if (isCafe) {
            setCafeWarehouseId(null);
        } else {
            setMainWarehouseId(null);
        }
        setIsLoading(true);
        setError(null);
    };

    // Loading holati
    if (isLoading) {
        return (
            <>
                <TopLoadingLine />
                {children}
            </>
        );
    }

    // Error holati
    if (error) {
        return (
            <Box
                position="fixed"
                top="0"
                left="0"
                right="0"
                bottom="0"
                bg={"bg"}
                backdropFilter="blur(12px)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                zIndex="9999"
            >
                <VStack
                    bg={"surface"}
                    p={8}
                    borderRadius="xl"
                    boxShadow="2xl"
                    spacing={4}
                    maxW="400px"
                    w="90%"
                >
                    <Text fontSize="2xl" fontWeight="bold" color="red.500">
                        ⚠️ Xatolik
                    </Text>
                    <Text textAlign="center" fontSize="md">
                        {error}
                    </Text>
                    <Box
                        as="button"
                        onClick={handleRetry}
                        px={6}
                        py={3}
                        bg={"primary"}
                        color="white"
                        borderRadius="lg"
                        fontWeight="semibold"
                        _hover={{ opacity: 0.9 }}
                        _active={{ transform: "scale(0.98)" }}
                        transition="all 0.2s"
                        cursor="pointer"
                    >
                        Qayta urinish
                    </Box>
                </VStack>
            </Box>
        );
    }

    // Hammasi tayyor bo'lsa children'ni render qilish
    return <>{children}</>;
}