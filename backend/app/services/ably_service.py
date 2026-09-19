import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger("cafe_qr.ably")


class AblyService:
    """Production Ably publisher service for real-time order events."""

    def __init__(self):
        self.api_key = settings.ABLY_API_KEY
        self._client = None
        if self.is_configured:
            try:
                from ably import AblyRest
                self._client = AblyRest(self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize AblyRest client: {e}")
                self._client = None

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def publish_new_order(self, order: Dict[str, Any]) -> bool:
        """
        Publish NEW_ORDER event to the cafe's private order channel
        and customer's specific order tracking channel.
        """
        if not self.is_configured or not self._client:
            logger.info("Ably not configured; skipped real-time NEW_ORDER publishing.")
            return False

        cafe_id = order.get("cafe_id")
        order_reference = order.get("order_reference")
        if not cafe_id:
            return False

        created_at_val = order.get("created_at")
        if hasattr(created_at_val, "isoformat"):
            created_at_str = created_at_val.isoformat()
        else:
            created_at_str = str(created_at_val or datetime.now(timezone.utc).isoformat())

        payload = {
            "event": "NEW_ORDER",
            "order_id": order.get("order_id"),
            "order_number": order.get("order_number"),
            "order_reference": order_reference,
            "cafe_id": cafe_id,
            "table_id": order.get("table_id"),
            "table_number": order.get("table_number"),
            "order_type": order.get("order_type", "DINE_IN"),
            "customer_name": order.get("customer_name"),
            "customer_phone": order.get("customer_phone"),
            "items": order.get("items", []),
            "subtotal": order.get("subtotal", 0.0),
            "tax": order.get("tax", 0.0),
            "total": order.get("total", 0.0),
            "order_status": order.get("order_status", "PLACED"),
            "created_at": created_at_str,
        }

        try:
            # 1. Publish to cafe admin channel: cafe:{cafe_id}:orders
            cafe_channel_name = f"cafe:{cafe_id}:orders"
            cafe_channel = self._client.channels.get(cafe_channel_name)
            await cafe_channel.publish("NEW_ORDER", payload)

            # 2. Publish to customer tracking channel if reference exists: order:{order_reference}
            if order_reference:
                order_channel_name = f"order:{order_reference}"
                order_channel = self._client.channels.get(order_channel_name)
                await order_channel.publish("NEW_ORDER", payload)

            return True
        except Exception as e:
            logger.error(f"Ably NEW_ORDER publish error for order {order.get('order_id')}: {e}")
            return False

    async def publish_order_status_update(
        self, order: Dict[str, Any], new_status: str
    ) -> bool:
        """
        Publish ORDER_{STATUS} event to cafe's order channel and customer tracking channel.
        """
        if not self.is_configured or not self._client:
            logger.info(f"Ably not configured; skipped real-time ORDER_{new_status} publishing.")
            return False

        cafe_id = order.get("cafe_id")
        order_reference = order.get("order_reference")
        event_name = f"ORDER_{new_status}"

        payload = {
            "event": event_name,
            "order_id": order.get("order_id"),
            "order_number": order.get("order_number"),
            "order_reference": order_reference,
            "cafe_id": cafe_id,
            "table_number": order.get("table_number"),
            "order_status": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        try:
            # 1. Publish to cafe admin channel
            cafe_channel_name = f"cafe:{cafe_id}:orders"
            cafe_channel = self._client.channels.get(cafe_channel_name)
            await cafe_channel.publish(event_name, payload)

            # 2. Publish to customer tracking channel
            if order_reference:
                order_channel_name = f"order:{order_reference}"
                order_channel = self._client.channels.get(order_channel_name)
                await order_channel.publish(event_name, payload)

            return True
        except Exception as e:
            logger.error(
                f"Ably {event_name} publish error for order {order.get('order_id')}: {e}"
            )
            return False

    async def create_token_request(
        self, client_id: str, capability: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a signed Ably token request for secure client-side connection
        without exposing the backend API key secret.
        """
        if not self.is_configured or not self._client:
            return {
                "configured": False,
                "message": "Ably is not configured on this server.",
            }

        try:
            token_params = {
                "client_id": client_id,
                "capability": capability,
            }
            token_request = await self._client.auth.create_token_request(token_params)
            return {
                "configured": True,
                "token_request": token_request,
            }
        except Exception as e:
            logger.error(f"Failed to create Ably token request: {e}")
            return {
                "configured": False,
                "error": str(e),
            }


ably_service = AblyService()
