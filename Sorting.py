def quick_sort(arr):
    if len(arr) <= 1:
        return arr

    pivot = arr[0]          # Choose the first element as pivot

    left = [x for x in arr[1:] if x <= pivot]
    right = [x for x in arr[1:] if x > pivot]

    return quick_sort(left) + [pivot] + quick_sort(right)


# Example
numbers = [8, 3, 1, 7, 0, 10, 2]

print("Original:", numbers)
print("Sorted:", quick_sort(numbers))