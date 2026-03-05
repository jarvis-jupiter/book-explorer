import { Router } from "express";
import express from "express";
import type { Request, Response } from "express";
import { Webhook } from "svix";
import type { UserRepositoryPort } from "../../../ports/user-repository.port.js";
import { errorResponse } from "../error-response.js";

type ClerkUserCreatedEvent = {
  type: "user.created" | "user.updated";
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    primary_email_address_id: string | null;
    first_name: string | null;
    last_name: string | null;
  };
};

type ClerkUserDeletedEvent = {
  type: "user.deleted";
  data: {
    id: string;
  };
};

type ClerkEvent = ClerkUserCreatedEvent | ClerkUserDeletedEvent;

export const createWebhooksRouter = (userRepository: UserRepositoryPort): Router => {
  const router = Router();

  // Must use raw body for svix signature verification
  router.post(
    "/clerk",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response): Promise<void> => {
      const svixId = req.headers["svix-id"];
      const svixTimestamp = req.headers["svix-timestamp"];
      const svixSignature = req.headers["svix-signature"];

      if (!svixId || !svixTimestamp || !svixSignature) {
        errorResponse(res, 400, "BAD_REQUEST", "Missing svix headers");
        return;
      }

      const secret = process.env["CLERK_WEBHOOK_SECRET"];

      if (!secret) {
        errorResponse(res, 500, "CONFIGURATION_ERROR", "Webhook secret not configured");
        return;
      }

      const wh = new Webhook(secret);
      let event: ClerkEvent;

      try {
        event = wh.verify(req.body, {
          "svix-id": String(svixId),
          "svix-timestamp": String(svixTimestamp),
          "svix-signature": String(svixSignature),
        }) as ClerkEvent;
      } catch {
        errorResponse(res, 400, "BAD_SIGNATURE", "Invalid webhook signature");
        return;
      }

      if (event.type === "user.created" || event.type === "user.updated") {
        const data = event.data;
        const primaryEmail = data.email_addresses.find(
          (e) => e.id === data.primary_email_address_id,
        );
        const email = primaryEmail?.email_address ?? data.id;
        const displayName = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

        await userRepository.upsertByClerkId({
          clerkId: data.id,
          email,
          displayName,
        });
      } else if (event.type === "user.deleted") {
        await userRepository.deleteByClerkId(event.data.id);
      }

      res.status(200).json({ received: true });
    },
  );

  return router;
};
