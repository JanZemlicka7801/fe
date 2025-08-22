import { Student } from '../pages/Students';

export interface StudentCreateDTO {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    lessons: number;
}

export const fetchStudents = async (token: string): Promise<Student[]> => {
    try {
        const response = await fetch('/api/students', {
            method: 'GET',
            mode: 'cors',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch students: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
    }
};

export const addStudent = async (studentData: StudentCreateDTO, token: string): Promise<Student> => {
    try {
        const response = await fetch('/api/students', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(studentData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to add student: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }

        const addedStudent = await response.json();
        return addedStudent;
    } catch (error) {
        console.error("Error adding student:", error);
        throw error;
    }
};