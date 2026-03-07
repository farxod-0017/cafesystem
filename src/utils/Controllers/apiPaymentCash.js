import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiPaymentCash {
    static getPage = async (cashId, page, limit) => {
        const response = await $api.get(`${BASE_URL}/payment-cash/pagination?cashId=${cashId}&page=${page}&limit=${limit}`)
        return response;
    }
    static Add = async (data) => {
        const response = await $api.post(`${BASE_URL}/payment-cash`, data, { showSuccessToast: "Summa hisoblandi" })
        return response;
    }
    // static Update = async (data, id) => {
    //     const response = await $api.put(`${BASE_URL}/cash/${id}`, data, { showSuccessToast: "Kassa o'zgartirildi" })
    //     return response;
    // }
    // static Delete = async (id) => {
    //     const response = await $api.delete(`${BASE_URL}/cash/${id}`, { showSuccessToast: "Kassa o'chirildi" })
    //     return response;
    // }
}

export { apiPaymentCash };