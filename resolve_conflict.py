
import os

def resolve_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()

    resolved_lines = []
    printing = True
    
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('<<<<<<<'):
            printing = False
        elif stripped.startswith('======='):
            printing = True
        elif stripped.startswith('>>>>>>>'):
            # Just skip the marker line, ensure printing is True (it should already be if we hit =======)
            # If we hit >>>>>>> without ======= (which shouldn't happen in standard 3-way conflict unless --ours/theirs logic differs), we usually assume end of block.
            # But here we assume: <<<<<<< skipped ======= kept >>>>>>>
            printing = True 
        else:
            if printing:
                resolved_lines.append(line)

    with open(filepath, 'w') as f:
        f.writelines(resolved_lines)

resolve_file('engine.js')
print("Resolved engine.js")
