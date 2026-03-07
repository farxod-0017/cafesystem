import { Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, Flex, Icon, Menu, MenuButton, MenuItem, MenuList, Text, VStack } from "@chakra-ui/react";
import { UserCog2 } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

export default function AppSidebar({ isOpen, onClose, links, role }) {
    const navigate = useNavigate()
    return (
        <Drawer
            isOpen={isOpen}
            placement="left"
            onClose={onClose}
        >
            <DrawerOverlay />
            <DrawerContent maxW={'75vw'} p={2}>
                <DrawerHeader mb={0}>
                    <DrawerCloseButton />
                </DrawerHeader>
                <DrawerBody p={1}>
                    <Flex direction={'column'} justify={'space-between'} align={'start'} minH={'calc(100vh - 20px)'}>
                        {/* TOP LINKS */}
                        <VStack align="stretch" spacing={2}>
                            {links.map((item) => (
                                <NavLink key={item.to} to={item.to} style={{ textDecoration: "none" }} end={item.end}>
                                    {({ isActive }) => (
                                        <Flex
                                            onClick={onClose}
                                            align="center"
                                            gap={3}
                                            px={3}
                                            py={'8px'}
                                            borderRadius="lg"
                                            bg={isActive ? "secondary" : "transparent"}
                                            _hover={{ bg: "secondary", color: "white" }}
                                            cursor="pointer"
                                            transition="0.2s"
                                            color={isActive ? "white" : "text"}
                                        >
                                            <Icon as={item.icon} boxSize={'22px'} />
                                            <Text fontSize="sm"
                                                fontWeight="500">{item.label}</Text>
                                        </Flex>
                                    )}
                                </NavLink>
                            ))}
                        </VStack>
                        <VStack>
                            {(role !== "SUPER_ADMIN") &&
                                <Menu>
                                    <MenuButton
                                        color={"text"}
                                        borderRadius={"md"}
                                        _hover={{ bg: "secondary", color: "white" }}
                                    >
                                        <Flex
                                            align="center"
                                            gap={3}
                                            py={2}
                                            px={3}
                                            borderRadius="md"
                                            w={'100%'}
                                        >
                                            <UserCog2 size={20} />
                                            <Text>Role</Text>
                                        </Flex>
                                    </MenuButton>
                                    <MenuList bg="surface" borderColor="gray.700" w={'50vw'} maxW={'50vw'} minW={'50vw'} p={1}>
                                        <MenuItem px={3}
                                            py={1} fontSize={'sm'} fontWeight={'500'} color={role === "ombor" ? "green" : "text"} onClick={() => {
                                                navigate('/ombor')
                                            }}>Ombor</MenuItem>
                                        <MenuItem px={3}
                                            py={1} fontSize={'sm'} fontWeight={'500'} color={role === "seller" ? "green" : "text"} onClick={() => {
                                                navigate('/cafe')
                                            }}>Cafe</MenuItem>
                                        <MenuItem px={3}
                                            py={1} fontSize={'sm'} fontWeight={'500'} color={role === "admin" ? "green" : "text"} onClick={() => {
                                                navigate('/')
                                            }}>Admin</MenuItem>
                                    </MenuList>
                                </Menu>}
                        </VStack>
                    </Flex>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    )
}