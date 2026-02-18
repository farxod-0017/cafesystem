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
    static Get = async (params = {}) => {
        // Создаем query string только из непустых параметров
        const queryParams = new URLSearchParams();

        // Добавляем только те параметры, которые есть и не пустые
        if (params.search) queryParams.append('search', params.search);
        if (params.type) queryParams.append('type', params.type);
        if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);

        const queryString = queryParams.toString();
        const url = queryString ? `${BASE_URL}/payments/page?${queryString}` : `${BASE_URL}/payments/page`;

        const response = await $api.get(url);
        return response;
    }
    static GetById = async (id) => {
        const response = await $api.get(`${BASE_URL}/payments/${id}`);
        return response
    }
}

export { apiPayment };