import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Flex,
    Heading,
    Text,
    Button,
    SimpleGrid,
    Card,
    CardBody,
    HStack,
    VStack,
    Stack,
    Skeleton,
    Icon,
    IconButton,
    Badge,
    Divider,
    useToast,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Wrap,
    WrapItem,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Package,
    Users,
    Building2,
    Wallet,
    ArrowDownCircle,
    ArrowUpCircle,
    Trash2,
    RefreshCw,
    Calendar,
    MinusCircle,
    PlusCircle,
    ShoppingCart,
    RotateCcw,
    CreditCard,
} from 'lucide-react';
import { apiStatistics } from '../../../utils/Controllers/apiStatistics';
import { apiCashs } from '../../../utils/Controllers/apiCashs';
import { useWarehouseStore } from '../../../store/useWarehouseStore';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const CafeStatisticsPage = () => {
    const toast = useToast();
    const { cafeWarehouseId, locationName } = useWarehouseStore();

    // Date filters
    const todayDef = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(todayDef);
    const [endDate, setEndDate] = useState('');

    // Data states
    const [balanceData, setBalanceData] = useState(null);
    const [statsData, setStatsData] = useState(null);
    const [cashboxes, setCashboxes] = useState([]);

    // Loading states
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingCashboxes, setLoadingCashboxes] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch balance data
    const fetchBalance = async () => {
        if (!cafeWarehouseId) return;

        setLoadingBalance(true);
        try {
            const res = await apiStatistics.getBalance(
                cafeWarehouseId,
                startDate || 'all',
                endDate || 'all'
            );
            if (res.data) {
                setBalanceData(res.data);
            }
        } catch (error) {
            toast({
                title: 'Xatolik',
                description: 'Balans ma\'lumotlarini yuklashda xatolik',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            console.error(error);
        } finally {
            setLoadingBalance(false);
        }
    };

    // Fetch statistics
    const fetchStatistics = async () => {
        if (!cafeWarehouseId) return;

        setLoadingStats(true);
        try {
            const res = await apiStatistics.getStatistics(cafeWarehouseId);
            if (res.data) {
                setStatsData(res.data);
            }
        } catch (error) {
            toast({
                title: 'Xatolik',
                description: 'Statistika ma\'lumotlarini yuklashda xatolik',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            console.error(error);
        } finally {
            setLoadingStats(false);
        }
    };

    // Fetch cashboxes
    const fetchCashboxes = async () => {
        if (!cafeWarehouseId) return;

        setLoadingCashboxes(true);
        try {
            const res = await apiCashs.getAll();
            if (res.data) {
                const filtered = res.data.filter(
                    (cash) => cash.locationId === cafeWarehouseId
                );
                setCashboxes(filtered);
            }
        } catch (error) {
            toast({
                title: 'Xatolik',
                description: 'Kassalarni yuklashda xatolik',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            console.error(error);
        } finally {
            setLoadingCashboxes(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (cafeWarehouseId && startDate !== null && endDate !== null) {
            fetchBalance();
        }
    }, [cafeWarehouseId, startDate, endDate]);

    useEffect(() => {
        if (cafeWarehouseId) {
            fetchStatistics();
            fetchCashboxes();
        }
    }, [cafeWarehouseId]);

    // Refresh all data
    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchBalance(), fetchStatistics(), fetchCashboxes()]);
        setRefreshing(false);
        toast({
            title: 'Yangilandi',
            description: 'Ma\'lumotlar yangilandi',
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
    };

    // Quick date filters
    const setQuickDate = (type) => {
        const today = new Date();
        let start, end;

        switch (type) {
            case 'today':
                start = today.toISOString().split('T')[0];
                end = ''
                break;
            case 'week':
                const weekStart = new Date(today);
                const day = today.getDay();
                const diff = day === 0 ? -6 : 1 - day;
                weekStart.setDate(today.getDate() + diff);
                start = weekStart.toISOString().split('T')[0];
                // end = today.toISOString().split('T')[0];
                end = ''
                break;
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 2)
                    .toISOString()
                    .split('T')[0];
                // end = today.toISOString().split('T')[0];
                end = ''
                break;
            case 'all':
                start = '';
                end = '';
                break;
            default:
                break;
        }

        setStartDate(start);
        setEndDate(end);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('uz-UZ', {
            maximumFractionDigits: 0,
        }).format(Math.abs(amount));
    };

    // Format large numbers
    const formatLargeNumber = (num) => {
        const absNum = Math.abs(num);
        if (absNum >= 1000000) {
            return (absNum / 1000000).toFixed(1) + 'M';
        } else if (absNum >= 1000) {
            return (absNum / 1000).toFixed(1) + 'K';
        }
        return absNum.toString();
    };

    // Get color for balance
    const getBalanceColor = (value) => {
        if (value > 0) return 'success';
        if (value < 0) return 'danger';
        return 'muted';
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4 },
        },
    };

    // Helper calculations
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const weekStart = new Date(today);
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(today.getDate() + diff);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 2);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const PROFIT = useMemo(() => {
        const plus = +balanceData?.outgoing?.sum + +balanceData?.sale?.sum;
        const minus = +balanceData?.incoming?.sum + +balanceData?.disposal?.sum + +balanceData?.disposalOut?.sum;
        return plus - minus
    }, [balanceData]);

    return (
        <Box minH="100vh" bg="bg" pb={6}>
            {/* Header */}
            <Box bg="surface" borderBottom="1px" borderColor="border" px={6} py={4}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                    <VStack align="start" spacing={1}>
                        <Heading size="lg" color="text">
                            Cafe Statistika
                        </Heading>
                        {locationName && (
                            <Text fontSize="sm" color="textSecondary">
                                {locationName}
                            </Text>
                        )}
                    </VStack>

                    <HStack spacing={2}>
                        <IconButton
                            aria-label="Yangilash"
                            icon={<RefreshCw size={18} />}
                            onClick={handleRefresh}
                            isLoading={refreshing}
                            variant="ghost"
                            colorScheme="blue"
                        />
                    </HStack>
                </Flex>
            </Box>

            {/* Date Filters */}
            <Box px={6} py={4}>
                <Card>
                    <CardBody>
                        <Stack spacing={4}>
                            <Flex align="center" gap={2}>
                                <Icon as={Calendar} color="primary" />
                                <Text fontWeight="semibold" color="text">
                                    Sana oralig'i
                                </Text>
                            </Flex>

                            <Wrap spacing={2}>
                                <WrapItem>
                                    <Button
                                        size="sm"
                                        variant={
                                            startDate === todayStr && endDate === ''
                                                ? 'solid'
                                                : 'outline'
                                        }
                                        colorScheme="blue"
                                        onClick={() => setQuickDate('today')}
                                    >
                                        Bugun
                                    </Button>
                                </WrapItem>
                                <WrapItem>
                                    <Button
                                        size="sm"
                                        variant={
                                            startDate === weekStartStr && endDate === ''
                                                ? 'solid'
                                                : 'outline'
                                        }
                                        colorScheme="blue"
                                        onClick={() => setQuickDate('week')}
                                    >
                                        Shu hafta
                                    </Button>
                                </WrapItem>
                                <WrapItem>
                                    <Button
                                        size="sm"
                                        variant={
                                            startDate === monthStartStr && endDate === ''
                                                ? 'solid'
                                                : 'outline'
                                        }
                                        colorScheme="blue"
                                        onClick={() => setQuickDate('month')}
                                    >
                                        Joriy oy
                                    </Button>
                                </WrapItem>
                                <WrapItem>
                                    <Button
                                        size="sm"
                                        variant={!startDate && !endDate ? 'solid' : 'outline'}
                                        colorScheme="blue"
                                        onClick={() => setQuickDate('all')}
                                    >
                                        Barchasi
                                    </Button>
                                </WrapItem>
                            </Wrap>

                            <Divider />

                            <HStack spacing={4} wrap="wrap">
                                <VStack align="start" spacing={1} flex={1} minW="200px">
                                    <Text fontSize="sm" color="textSecondary">
                                        Boshlanish
                                    </Text>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--chakra-colors-border)',
                                            width: '100%',
                                            backgroundColor: 'var(--chakra-colors-surface)',
                                            color: 'var(--chakra-colors-text)',
                                        }}
                                    />
                                </VStack>

                                <VStack align="start" spacing={1} flex={1} minW="200px">
                                    <Text fontSize="sm" color="textSecondary">
                                        Tugash
                                    </Text>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--chakra-colors-border)',
                                            width: '100%',
                                            backgroundColor: 'var(--chakra-colors-surface)',
                                            color: 'var(--chakra-colors-text)',
                                        }}
                                    />
                                </VStack>
                            </HStack>
                        </Stack>
                    </CardBody>
                </Card>
            </Box>

            {/* Main Content */}
            <Box px={6}>
                <MotionBox variants={containerVariants} initial="hidden" animate="visible">
                    {/* Quick Stats */}
                    <MotionBox variants={itemVariants} mb={6}>
                        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
                            {/* Partners */}
                            <MotionCard whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                                <CardBody>
                                    {loadingStats ? (
                                        <Skeleton height="80px" />
                                    ) : (
                                        <Stat>
                                            <Flex justify="space-between" align="start">
                                                <Box>
                                                    <StatLabel color="textSecondary" fontSize="sm">
                                                        Ta'minotchilar
                                                    </StatLabel>
                                                    <StatNumber color="text" fontSize="3xl">
                                                        {statsData?.partnerCount || 0}
                                                    </StatNumber>
                                                </Box>
                                                <Box p={3} bg="infoBg" borderRadius="lg">
                                                    <Icon as={Building2} color="info" boxSize={6} />
                                                </Box>
                                            </Flex>
                                        </Stat>
                                    )}
                                </CardBody>
                            </MotionCard>

                            {/* Clients */}
                            <MotionCard whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                                <CardBody>
                                    {loadingStats ? (
                                        <Skeleton height="80px" />
                                    ) : (
                                        <Stat>
                                            <Flex justify="space-between" align="start">
                                                <Box>
                                                    <StatLabel color="textSecondary" fontSize="sm">
                                                        Klientlar
                                                    </StatLabel>
                                                    <StatNumber color="text" fontSize="3xl">
                                                        {statsData?.clientCount || 0}
                                                    </StatNumber>
                                                </Box>
                                                <Box p={3} bg="successBg" borderRadius="lg">
                                                    <Icon as={Users} color="success" boxSize={6} />
                                                </Box>
                                            </Flex>
                                        </Stat>
                                    )}
                                </CardBody>
                            </MotionCard>

                            {/* Products */}
                            <MotionCard whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                                <CardBody>
                                    {loadingStats ? (
                                        <Skeleton height="80px" />
                                    ) : (
                                        <Stat>
                                            <Flex justify="space-between" align="start">
                                                <Box>
                                                    <StatLabel color="textSecondary" fontSize="sm">
                                                        Mahsulotlar
                                                    </StatLabel>
                                                    <StatNumber color="text" fontSize="3xl">
                                                        {statsData?.stockProductCount || 0}
                                                    </StatNumber>
                                                </Box>
                                                <Box p={3} bg="warningBg" borderRadius="lg">
                                                    <Icon as={Package} color="warning" boxSize={6} />
                                                </Box>
                                            </Flex>
                                        </Stat>
                                    )}
                                </CardBody>
                            </MotionCard>

                            {/* Profit */}
                            <MotionCard whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                                <CardBody>
                                    {loadingBalance ? (
                                        <Skeleton height="80px" />
                                    ) : (
                                        <Stat>
                                            <Flex justify="space-between" align="start">
                                                <Box>
                                                    <StatLabel color="textSecondary" fontSize="sm">
                                                        Foyda
                                                    </StatLabel>
                                                    <StatNumber
                                                        color={getBalanceColor(PROFIT || 0)}
                                                        fontSize="3xl"
                                                    >
                                                        {PROFIT >= 0 ? '' : '-'}
                                                        {formatLargeNumber(PROFIT || 0)}
                                                    </StatNumber>
                                                    <StatHelpText fontSize="xs" color="textSecondary">
                                                        {PROFIT >= 0 ? '' : '-'}
                                                        {formatCurrency(PROFIT || 0)} so'm
                                                    </StatHelpText>
                                                </Box>
                                                <Box
                                                    p={3}
                                                    bg={PROFIT >= 0 ? 'successBg' : 'dangerBg'}
                                                    borderRadius="lg"
                                                >
                                                    <Icon
                                                        as={PROFIT >= 0 ? TrendingUp : TrendingDown}
                                                        color={PROFIT >= 0 ? 'success' : 'danger'}
                                                        boxSize={6}
                                                    />
                                                </Box>
                                            </Flex>
                                        </Stat>
                                    )}
                                </CardBody>
                            </MotionCard>
                        </SimpleGrid>
                    </MotionBox>

                    {/* Zakazlar (Sale, Return, Disposal) */}
                    <MotionBox variants={itemVariants} mb={6}>
                        <Heading size="md" color="text" mb={4}>
                            Zakazlar
                        </Heading>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                            {/* Sale */}
                            <Card>
                                <CardBody>
                                    {loadingBalance ? (
                                        <Skeleton height="100px" />
                                    ) : (
                                        <VStack align="stretch" spacing={3}>
                                            <Flex justify="space-between" align="center">
                                                <HStack>
                                                    <Icon as={ShoppingCart} color="success" boxSize={6} />
                                                    <Text fontWeight="semibold" color="text">
                                                        Sotilgan
                                                    </Text>
                                                </HStack>
                                                <Badge colorScheme="green">
                                                    {balanceData?.sale?.count || 0} ta
                                                </Badge>
                                            </Flex>
                                            <Text fontSize="2xl" fontWeight="bold" color="success">
                                                {formatCurrency(balanceData?.sale?.sum || 0)} so'm
                                            </Text>
                                        </VStack>
                                    )}
                                </CardBody>
                            </Card>

                            {/* Return */}
                            <Card>
                                <CardBody>
                                    {loadingBalance ? (
                                        <Skeleton height="100px" />
                                    ) : (
                                        <VStack align="stretch" spacing={3}>
                                            <Flex justify="space-between" align="center">
                                                <HStack>
                                                    <Icon as={RotateCcw} color="danger" boxSize={6} />
                                                    <Text fontWeight="semibold" color="text">
                                                        Qaytarilgan
                                                    </Text>
                                                </HStack>
                                                <Badge colorScheme="red">
                                                    {balanceData?.return?.count || 0} ta
                                                </Badge>
                                            </Flex>
                                            <Text fontSize="2xl" fontWeight="bold" color="danger">
                                                {balanceData?.return?.sum >= 0 ? '' : '-'}
                                                {formatCurrency(balanceData?.return?.sum || 0)} so'm
                                            </Text>
                                        </VStack>
                                    )}
                                </CardBody>
                            </Card>

                            {/* Disposal */}
                            <Card>
                                <CardBody>
                                    {loadingBalance ? (
                                        <Skeleton height="100px" />
                                    ) : (
                                        <VStack align="stretch" spacing={3}>
                                            <Flex justify="space-between" align="center">
                                                <HStack>
                                                    <Icon as={Trash2} color="warning" boxSize={6} />
                                                    <Text fontWeight="semibold" color="text">
                                                        Utilizatsiya
                                                    </Text>
                                                </HStack>
                                                <Badge colorScheme="orange">
                                                    {balanceData?.disposal?.count || 0} ta
                                                </Badge>
                                            </Flex>
                                            <Text fontSize="2xl" fontWeight="bold" color="warning">
                                                {formatCurrency(balanceData?.disposal?.sum || 0)} so'm
                                            </Text>
                                        </VStack>
                                    )}
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </MotionBox>

                    {/* To'lov usullari bo'yicha */}
                    {balanceData?.payMethods && balanceData.payMethods.length > 0 && (
                        <MotionBox variants={itemVariants} mb={6}>
                            <Heading size="md" color="text" mb={4}>
                                To'lov usullari bo'yicha
                            </Heading>
                            <Card>
                                <CardBody>
                                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                                        {balanceData.payMethods.map((method) => (
                                            <Box
                                                key={method.payMethodId}
                                                p={4}
                                                bg="mutedBg"
                                                borderRadius="lg"
                                            >
                                                <VStack align="stretch" spacing={2}>
                                                    <HStack justify="space-between">
                                                        <HStack>
                                                            <Icon as={CreditCard} color="primary" boxSize={5} />
                                                            <Text fontWeight="semibold" color="text">
                                                                {method['payMethod.name']}
                                                            </Text>
                                                        </HStack>
                                                        <Badge colorScheme="blue">{method.count} ta</Badge>
                                                    </HStack>
                                                    <Text fontSize="xl" fontWeight="bold" color="primary">
                                                        {formatCurrency(method.sum)} so'm
                                                    </Text>
                                                </VStack>
                                            </Box>
                                        ))}
                                    </SimpleGrid>
                                </CardBody>
                            </Card>
                        </MotionBox>
                    )}

                    {/* Kassalar bo'yicha zakazlar */}
                    {balanceData?.cash && balanceData.cash.length > 0 && (
                        <MotionBox variants={itemVariants} mb={6}>
                            <Heading size="md" color="text" mb={4}>
                                Kassalar bo'yicha zakazlar
                            </Heading>
                            <Card>
                                <CardBody>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        {balanceData.cash.map((cash) => (
                                            <Box
                                                key={cash.cashId}
                                                p={4}
                                                bg="infoBg"
                                                borderRadius="lg"
                                            >
                                                <VStack align="stretch" spacing={2}>
                                                    <HStack justify="space-between">
                                                        <HStack>
                                                            <Icon as={Wallet} color="info" boxSize={5} />
                                                            <Text fontWeight="semibold" color="text">
                                                                {cash['cash.name']}
                                                            </Text>
                                                        </HStack>
                                                        <Badge colorScheme="blue">{cash.count} ta</Badge>
                                                    </HStack>
                                                    <Text fontSize="xl" fontWeight="bold" color="info">
                                                        {formatCurrency(cash.sum)} so'm
                                                    </Text>
                                                </VStack>
                                            </Box>
                                        ))}
                                    </SimpleGrid>
                                </CardBody>
                            </Card>
                        </MotionBox>
                    )}

                    {/* Kassalar */}
                    {cashboxes.length > 1 && (
                        <MotionBox variants={itemVariants} mb={6}>
                            <Heading size="md" color="text" mb={4}>
                                Kassalar ({cashboxes.length})
                            </Heading>
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                                {loadingCashboxes
                                    ? [1, 2, 3].map((i) => (
                                        <Card key={i}>
                                            <CardBody>
                                                <Skeleton height="80px" />
                                            </CardBody>
                                        </Card>
                                    ))
                                    : cashboxes.map((cash) => (
                                        <MotionCard
                                            key={cash.id}
                                            whileHover={{ y: -4 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <CardBody>
                                                <Flex justify="space-between" align="start">
                                                    <VStack align="start" spacing={1}>
                                                        <HStack>
                                                            <Icon
                                                                as={Wallet}
                                                                color="primary"
                                                                boxSize={5}
                                                            />
                                                            <Text fontWeight="semibold" color="text">
                                                                {cash.name}
                                                            </Text>
                                                        </HStack>
                                                        <Text
                                                            fontSize="2xl"
                                                            fontWeight="bold"
                                                            color={getBalanceColor(
                                                                Number(cash.balance) || 0
                                                            )}
                                                        >
                                                            {cash.balance >= 0 ? '' : '-'}
                                                            {formatCurrency(cash.balance)} so'm
                                                        </Text>
                                                    </VStack>
                                                </Flex>
                                            </CardBody>
                                        </MotionCard>
                                    ))}
                            </SimpleGrid>
                        </MotionBox>
                    )}

                    {/* Single Kassa */}
                    {cashboxes.length === 1 && !loadingCashboxes && (
                        <MotionBox variants={itemVariants} mb={6}>
                            <Card>
                                <CardBody>
                                    <Flex justify="space-between" align="center" wrap="wrap">
                                        <HStack spacing={3}>
                                            <Box display={{base:"none", md:"block"}} p={3} bg="infoBg" borderRadius="lg">
                                                <Icon as={Wallet} color="info" boxSize={8} />
                                            </Box>
                                            <VStack align="start" spacing={0}>
                                                <Text fontSize="sm" color="textSecondary">
                                                    {cashboxes[0].name}
                                                </Text>
                                                <Text
                                                    fontSize="3xl"
                                                    fontWeight="bold"
                                                    color={getBalanceColor(
                                                        Number(cashboxes[0].balance) || 0
                                                    )}
                                                >
                                                    {cashboxes[0].balance >= 0 ? '' : '-'}
                                                    {formatCurrency(cashboxes[0].balance)} so'm
                                                </Text>
                                            </VStack>
                                        </HStack>
                                    </Flex>
                                </CardBody>
                            </Card>
                        </MotionBox>
                    )}

                    {/* Operatsiyalar */}
                    <MotionBox variants={itemVariants} mb={6}>
                        <Heading size="md" color="text" mb={4}>
                            Operatsiyalar
                        </Heading>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                            {/* Incoming */}
                            <Card>
                                <CardBody>
                                    {loadingBalance ? (
                                        <Skeleton height="100px" />
                                    ) : (
                                        <VStack align="stretch" spacing={3}>
                                            <Flex justify="space-between" align="center">
                                                <HStack>
                                                    <Icon
                                                        as={ArrowDownCircle}
                                                        color="chartIncoming"
                                                        boxSize={6}
                                                    />
                                                    <Text fontWeight="semibold" color="text">
                                                        Kirim
                                                    </Text>
                                                </HStack>
                                                <Badge colorScheme="green">
                                                    {balanceData?.incoming?.count || 0} ta
                                                </Badge>
                                            </Flex>
                                            <Text fontSize="2xl" fontWeight="bold" color="chartIncoming">
                                                {formatCurrency(balanceData?.incoming?.sum || 0)} so'm
                                            </Text>
                                        </VStack>
                                    )}
                                </CardBody>
                            </Card>

                            {/* Outgoing */}
                            <Card>
                                <CardBody>
                                    {loadingBalance ? (
                                        <Skeleton height="100px" />
                                    ) : (
                                        <VStack align="stretch" spacing={3}>
                                            <Flex justify="space-between" align="center">
                                                <HStack>
                                                    <Icon
                                                        as={ArrowUpCircle}
                                                        color="chartOutgoing"
                                                        boxSize={6}
                                                    />
                                                    <Text fontWeight="semibold" color="text">
                                                        Chiqim
                                                    </Text>
                                                </HStack>
                                                <Badge colorScheme="blue">
                                                    {balanceData?.outgoing?.count || 0} ta
                                                </Badge>
                                            </Flex>
                                            <Text fontSize="2xl" fontWeight="bold" color="chartOutgoing">
                                                {formatCurrency(balanceData?.outgoing?.sum || 0)} so'm
                                            </Text>
                                        </VStack>
                                    )}
                                </CardBody>
                            </Card>

                            {/* Disposal Out */}
                            <Card>
                                <CardBody>
                                    {loadingBalance ? (
                                        <Skeleton height="100px" />
                                    ) : (
                                        <VStack align="stretch" spacing={3}>
                                            <Flex justify="space-between" align="center">
                                                <HStack>
                                                    <Icon
                                                        as={Trash2}
                                                        color="chartDisposal"
                                                        boxSize={6}
                                                    />
                                                    <Text fontWeight="semibold" color="text">
                                                        Utilizatsiya
                                                    </Text>
                                                </HStack>
                                                <Badge colorScheme="orange">
                                                    {balanceData?.disposalOut?.count || 0} ta
                                                </Badge>
                                            </Flex>
                                            <Text fontSize="2xl" fontWeight="bold" color="chartDisposal">
                                                {formatCurrency(balanceData?.disposalOut?.sum || 0)} so'm
                                            </Text>
                                        </VStack>
                                    )}
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </MotionBox>

                    {/* Moliyaviy */}
                    <MotionBox variants={itemVariants}>
                        <Heading size="md" color="text" mb={4}>
                            Moliyaviy holat
                        </Heading>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            {/* Client Balances */}
                            <Card>
                                <CardBody>
                                    {loadingBalance ? (
                                        <Skeleton height="150px" />
                                    ) : (
                                        <VStack align="stretch" spacing={4}>
                                            <Flex align="center" gap={2}>
                                                <Icon as={Users} color="primary" boxSize={6} />
                                                <Text fontWeight="bold" color="text" fontSize="lg">
                                                    Klientlar
                                                </Text>
                                            </Flex>

                                            <Divider />

                                            <HStack justify="space-between">
                                                <VStack align="start" spacing={1}>
                                                    <HStack>
                                                        <Icon as={MinusCircle} color="danger" boxSize={4} />
                                                        <Text fontSize="sm" color="textSecondary">
                                                            Qarzdorlar
                                                        </Text>
                                                    </HStack>
                                                    <Text fontSize="xl" fontWeight="bold" color="danger">
                                                        {formatCurrency(balanceData?.clientMinus || 0)} so'm
                                                    </Text>
                                                </VStack>

                                                <VStack align="end" spacing={1}>
                                                    <HStack>
                                                        <Text fontSize="sm" color="textSecondary">
                                                            Bizning qarz
                                                        </Text>
                                                        <Icon as={PlusCircle} color="success" boxSize={4} />
                                                    </HStack>
                                                    <Text fontSize="xl" fontWeight="bold" color="success">
                                                        {formatCurrency(balanceData?.clientPlus || 0)} so'm
                                                    </Text>
                                                </VStack>
                                            </HStack>
                                        </VStack>
                                    )}
                                </CardBody>
                            </Card>

                            {/* Partner Balances */}
                            <Card>
                                <CardBody>
                                    {loadingBalance ? (
                                        <Skeleton height="150px" />
                                    ) : (
                                        <VStack align="stretch" spacing={4}>
                                            <Flex align="center" gap={2}>
                                                <Icon as={Building2} color="primary" boxSize={6} />
                                                <Text fontWeight="bold" color="text" fontSize="lg">
                                                    Ta'minotchilar
                                                </Text>
                                            </Flex>

                                            <Divider />

                                            <HStack justify="space-between">
                                                <VStack align="start" spacing={1}>
                                                    <HStack>
                                                        <Icon as={MinusCircle} color="danger" boxSize={4} />
                                                        <Text fontSize="sm" color="textSecondary">
                                                            Qarzdorlar
                                                        </Text>
                                                    </HStack>
                                                    <Text fontSize="xl" fontWeight="bold" color="danger">
                                                        {formatCurrency(balanceData?.partnerMinus || 0)} so'm
                                                    </Text>
                                                </VStack>

                                                <VStack align="end" spacing={1}>
                                                    <HStack>
                                                        <Text fontSize="sm" color="textSecondary">
                                                            Bizning qarzimiz
                                                        </Text>
                                                        <Icon as={PlusCircle} color="success" boxSize={4} />
                                                    </HStack>
                                                    <Text fontSize="xl" fontWeight="bold" color="success">
                                                        {formatCurrency(balanceData?.partnerPlus || 0)} so'm
                                                    </Text>
                                                </VStack>
                                            </HStack>
                                        </VStack>
                                    )}
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </MotionBox>
                </MotionBox>
            </Box>
        </Box>
    );
};

export default CafeStatisticsPage;