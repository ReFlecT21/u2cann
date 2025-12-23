import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "@adh/db";

export const customerContentRouter = createTRPCRouter({
  // Simple test endpoint
  test: publicProcedure
    .query(() => {
      return { message: "Hello from tRPC!" };
    }),

  // Get articles for Discover page
  getArticles: publicProcedure
    .query(async (opts) => {
      console.log('📰 getArticles called with input:', opts.input);
      try {
        const articles = await db.article.findMany({
          where: {
            published: true,
          },
          orderBy: { publishedAt: 'desc' },
          take: 10,
        });
        console.log('📰 getArticles found', articles.length, 'articles');
        return articles;
      } catch (error) {
        console.error('❌ getArticles error:', error);
        throw error;
      }
    }),

  // Get promotions
  getPromotions: publicProcedure
    .query(async (opts) => {
      console.log('🎉 getPromotions called with input:', opts.input);
      try {
        const now = new Date();
        const promotions = await db.promotion.findMany({
          where: {
            active: true,
            validFrom: { lte: now },
            validTo: { gte: now },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });
        console.log('🎉 getPromotions found', promotions.length, 'promotions');
        return promotions;
      } catch (error) {
        console.error('❌ getPromotions error:', error);
        throw error;
      }
    }),

  // Get services for PetSelection
  getServices: publicProcedure
    .query(async () => {
      const services = await db.service.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          duration: true,
        },
        orderBy: { name: 'asc' },
      });

      // Group by unique service names (since services might be duplicated across clinics)
      const uniqueServices = services.reduce((acc, service) => {
        if (!acc.find(s => s.name === service.name)) {
          acc.push(service);
        }
        return acc;
      }, [] as typeof services);

      return uniqueServices;
    }),

  // Get featured veterinarians for Explore section
  getFeaturedVets: publicProcedure
    .query(async (opts) => {
      console.log('👨‍⚕️ getFeaturedVets called with input:', opts.input);
      try {
        const vets = await db.veterinarian.findMany({
          include: {
            clinic: {
              select: {
                name: true,
                address: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });
        console.log('👨‍⚕️ getFeaturedVets found', vets.length, 'vets');
        return vets;
      } catch (error) {
        console.error('❌ getFeaturedVets error:', error);
        throw error;
      }
    }),
});