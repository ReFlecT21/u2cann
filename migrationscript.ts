import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fetchCompanies() {
    try {
        const companies = await prisma.companies.findMany({
            where: { website: { not: null } },  // Fetch only companies with a website
            select: { id: true, name: true, website: true } // Select only relevant fields
        });

        console.log("Fetched Companies:", companies);
    } catch (error) {
        console.error("Error fetching companies:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the function
fetchCompanies();
