import {useDragScroll} from "./useDragScroll";

const books = [
    {
        id: 1,
        label: 'Book 1',
        bg: 'white',
        stages: [
            {
                id: 1,
                label: 'stage 1',
            },
            {
                id: 2,
                label: 'stage 2',
            },
            {
                id: 3,
                label: 'stage 3',
            },
            {
                id: 4,
                label: 'stage 4',
            }
        ]
    },
    {
        id: 2,
        label: 'Book 2',
        bg: 'white',
        stages: [
            {
                id: 1,
                label: 'stage 1',
            },
            {
                id: 2,
                label: 'stage 2',
            },
            {
                id: 3,
                label: 'stage 3',
            }
        ]
    },
    {
        id: 3,
        label: 'Book 3',
        bg: 'white',
        stages: [
            {
                id: 1,
                label: 'stage 1',
            },
            {
                id: 2,
                label: 'stage 2',
            },
            {
                id: 3,
                label: 'stage 3',
            },
            {
                id: 4,
                label: 'stage 4',
            },
            {
                id: 5,
                label: 'stage 5',
            }
        ]
    },
    {
        id: 4,
        label: 'Book 4',
        bg: 'white',
        stages: [
            {
                id: 1,
                label: 'stage 1',
            },
            {
                id: 2,
                label: 'stage 2',
            },
            {
                id: 3,
                label: 'stage 3',
            },
            {
                id: 4,
                label: 'stage 4',
            }
        ]
    },
]

function CardsMarket() {

    return (
        <div className={"flex flex-col items-start justify-start max-w-2xl mx-auto shadow-2xl min-h-screen"}>
            {/* Navigation */}
            <div className="flex items-center justify-between w-full h-20 px-4 shadow-lg">
                <h1 className={"text-3xl text-white"}>Kutubxonam</h1>
                <button className={"text-white text-3xl"}>▶</button>
            </div>
            <div className="w-full flex flex-col gap-10 py-6 sm:py-8 px-4 sm:px-6 lg:px-10">
                {books.map((book) => {
                    const drag = useDragScroll()

                    return (
                        /* BARCHA ROW SCROLL BO‘LADI */
                        <div
                            key={book.id}
                            ref={drag.ref}
                            className="
          flex w-full overflow-x-auto scrollbar-hide
          gap-4 sm:gap-6
          select-none cursor-grab active:cursor-grabbing
        "
                            onMouseDown={drag.onMouseDown}
                            onMouseMove={drag.onMouseMove}
                            onMouseUp={drag.onMouseUp}
                            onMouseLeave={drag.onMouseLeave}
                        >

                            {/* Book */}
                            <div
                                className="
            flex-shrink-0
            w-[180px] lg:w-[200px]
            h-[220px] sm:h-[260px] lg:h-[280px]
            rounded-xl shadow-lg border border-gray-700
            flex items-center justify-center text-white
          "
                            >
                                {book.label}
                            </div>

                            {/* Stages */}
                            {book.stages.map((stage) => (
                                <div
                                    key={stage.id}
                                    className="
              flex-shrink-0
              w-[160px] sm:w-[180px] lg:w-[200px]
              h-[220px] sm:h-[260px] lg:h-[280px]
              rounded-xl shadow-lg border border-gray-700
              flex items-center justify-center text-white
            "
                                >
                                    {stage.label}
                                </div>
                            ))}

                        </div>
                    )
                })}
            </div>
        </div>
    );
}

export default CardsMarket;