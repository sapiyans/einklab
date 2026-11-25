from ninja import NinjaAPI

from screensaver.api import router as screensaver_router

api = NinjaAPI()

api.add_router("/screensaver/", screensaver_router)
