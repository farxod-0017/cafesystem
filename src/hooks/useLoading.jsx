import { useLoadingStore } from "../store/loadingStore";

export const useLoading = () => {
    const {
        table,
        modalSubmit,
        action,
        setTableLoading,
        setModalSubmit,
        startAction,
        stopAction
    } = useLoadingStore();

    return {
        table,
        modalSubmit,
        action,
        setTableLoading,
        setModalSubmit,
        startAction,
        stopAction,
    };
};
