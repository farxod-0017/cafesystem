import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiInvoices {
    static All = async () => {
        const response = await $api.get(`${BASE_URL}/invoices`)
        return response
    }
    static getDetailedById = async (id) => {
        const response = await $api.get(`${BASE_URL}/invoices/${id}`)
        return response;
    }
    static getFilteredProducts = async (locId, search, page, limit) => {
        const response = await $api.get(`${BASE_URL}/products/location?locationId=${locId}&search=${search}&page=${page}&limit=${limit}`);
        return response;
    }
    static getFilteredInvoices = async (locId, startDate, endDate, operationType, status, payment, search, page ) => {
        const response = await $api.get(`${BASE_URL}/invoices/filter/${locId}/${startDate}/${endDate}/${operationType}/${status}/${payment}/${search}/page?page=${page}`);
        return response;
    }
    static Add = async (data) => {
        const response = await $api.post(`${BASE_URL}/invoices`, data)
        return response;
    }
    static Update = async (data, id) => {
        const response = await $api.put(`${BASE_URL}/invoices/${id}`, data, {showSuccessToast:"Hisob yangilandi"})
        return response
    }
    static UpdateStatus = async (data, id) => {
        const response = await $api.put(`${BASE_URL}/invoices/type/${id}`, data, {showSuccessToast:"Status yangilandi"})
        return response;
    }
    static Delete = async (id) => {
        const response = await $api.delete(`${BASE_URL}/invoices/${id}`, {showSuccessToast:"Hisob o'chirildi"})
        return response;
    }
       static getByInvoiceId = async (invoiceId, page = 1) => {
        const response = await $api.get(
            `${BASE_URL}/invoice-items/${invoiceId}/page?page=${page}`
        );
        return response;
    };
}

export { apiInvoices };