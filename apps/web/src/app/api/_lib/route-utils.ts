import { NextResponse } from "next/server";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Internal server error";
}

function getErrorStatus(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }

  return 500;
}

export async function handleRoute(handler: () => Promise<unknown>) {
  try {
    const data = await handler();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: getErrorMessage(error),
          status: getErrorStatus(error)
        }
      },
      { status: getErrorStatus(error) }
    );
  }
}
