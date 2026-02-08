import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiPayment {
    static Create = async (data) => {
        const response = await $api.post(`${BASE_URL}/payments`, data,)
        return response;
    }
    static CreateReturn = async (data) => {
        const response = await $api.post(`${BASE_URL}/payments/return`, data,)
        return response;
    }
    static EditSum = async (id, data) => {
        const response = await $api.put(`${BASE_URL}/payments/${id}/received-sum`, data,)
        return response;
    }
    static EditStatus = async (id, data) => {
        const response = await $api.put(`${BASE_URL}/payments/${id}/status`, data,)
        return response;
    }
    static Get = async (data) => {
        const response = await $api.get(`${BASE_URL}/payments/page?search=${data?.search}&page=${data?.page}&limit=${data?.limit}`, data,)
        return response;
    }
}

export { apiPayment };