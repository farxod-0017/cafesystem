import { Button, Text, useClipboard, HStack } from '@chakra-ui/react';

function CopyUsername({ username="" }) {
    const { hasCopied, onCopy } = useClipboard(username);

    return (
        <HStack spacing={2}>
            <Button
                variant="link"
                size="sm"
                onClick={onCopy}
                aria-label={`Copy username ${username}`}
                fontWeight="medium"
            >
                {username}
            </Button>

            {hasCopied && (
                <Text fontSize="xs" color="green.500">
                    Copied
                </Text>
            )}
        </HStack>
    );
}

export default CopyUsername;
